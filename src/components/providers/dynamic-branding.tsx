import { createClient } from "@/lib/supabase/server";

export async function DynamicBranding() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["branding"]);

  const brandingMap: Record<string, any> = {};
  settings?.forEach((s) => {
    brandingMap[s.key] = s.value;
  });

  const branding = brandingMap.branding || {};
  const primaryColor = branding.primary_color || "#1E3A5F";
  const secondaryColor = branding.secondary_color || "#4ADE80";
  const fontFamily = branding.font_family || "Inter";

  const isDefaultFont = fontFamily.toLowerCase() === "inter";

  // Google Fonts URL string based on selected font
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
    /\s+/g,
    "+"
  )}:wght@400;500;600;700;800&display=swap`;

  return (
    <>
      {!isDefaultFont && (
        <>
          <link rel="preload" href={googleFontsUrl} as="style" />
          <link 
            href={googleFontsUrl} 
            rel="stylesheet" 
            media="print" 
            onLoad={(e) => { 
              e.currentTarget.media = "all"; 
            }} 
          />
          <noscript>
            <link href={googleFontsUrl} rel="stylesheet" />
          </noscript>
        </>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --brand-primary: ${primaryColor};
            --brand-secondary: ${secondaryColor};
            --font-sans: ${
              isDefaultFont 
                ? "var(--font-inter), ui-sans-serif, system-ui, sans-serif" 
                : `"${fontFamily}", ui-sans-serif, system-ui, sans-serif`
            };
          }
          
          .dark {
            /* If we ever want different logic for dark mode brand colors, we could add it here, 
               but for now we map them directly unless overridden. */
            --brand-primary: ${primaryColor};
            --brand-secondary: ${secondaryColor};
          }
        `,
      }} />
    </>
  );
}
