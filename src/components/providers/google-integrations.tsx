import { createClient } from "@/lib/supabase/server"
import Script from "next/script"

interface IntegrationSettings {
    google_analytics_id?: string
    google_tag_manager_id?: string
    google_search_console_code?: string
}

async function getIntegrations() {
    const supabase = await createClient()
    const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "integrations")
        .single()
    
    return (data?.value as IntegrationSettings) || {}
}

/**
 * Injects scripts into the <head>
 */
export async function GoogleHeadIntegrations() {
    const integrations = await getIntegrations()
    const gaId = integrations.google_analytics_id?.trim()
    const gtmId = integrations.google_tag_manager_id?.trim()
    const gscCode = integrations.google_search_console_code?.trim()

    return (
        <>
            {/* Google Search Console Verification */}
            {gscCode && (
                gscCode.startsWith('<meta') ? (
                    // If the user pasted the full tag
                    <div dangerouslySetInnerHTML={{ __html: gscCode }} />
                ) : (
                    // If they just pasted the code
                    <meta name="google-site-verification" content={gscCode} />
                )
            )}

            {/* Google Analytics 4 */}
            {gaId && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${gaId}');
                        `}
                    </Script>
                </>
            )}

            {/* Google Tag Manager */}
            {gtmId && (
                <Script id="google-tag-manager" strategy="afterInteractive">
                    {`
                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','${gtmId}');
                    `}
                </Script>
            )}
        </>
    )
}

/**
 * Injects scripts at the start of the <body>
 */
export async function GoogleBodyIntegrations() {
    const integrations = await getIntegrations()
    const gtmId = integrations.google_tag_manager_id?.trim()

    if (!gtmId) return null

    return (
        <noscript>
            <iframe 
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height="0" 
                width="0" 
                style={{ display: 'none', visibility: 'hidden' }}
            />
        </noscript>
    )
}
