import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Use the Service Role Key to bypass RLS, because platform_settings 
    // might be restricted from anonymous reads by default.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Quick public read from platform_settings
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'branding')
      .single()

    if (error) {
      console.error("Favicon Supabase fetch error:", error.message)
    }

    const faviconUrl = data?.value?.favicon_url || data?.value?.logo_url

    if (faviconUrl) {
      // Instead of redirecting which some browsers ignore for favicons, construct a reliable image response
      const response = await fetch(faviconUrl)
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/x-icon'
        const arrayBuffer = await response.arrayBuffer()
        
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': contentType,
            // Prevent Next static build caching, but allow browser to cache actively
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          }
        })
      }
    }
  } catch (error) {
    console.error("Favicon proxy error:", error)
  }

  // Fallback to a placeholder base64 blank icon to prevent 404s if nothing is uploaded yet
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1E3A5F"/></svg>`
  return new NextResponse(svg, {
    headers: { 
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60'
    }
  })
}
