import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Quick public read from platform_settings
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'branding')
      .single()

    if (data?.value?.favicon_url) {
      return NextResponse.redirect(data.value.favicon_url)
    }
  } catch (error) {
    console.error("Favicon redirect error:", error)
  }

  // Fallback to a placeholder base64 blank icon to prevent 404s if nothing is uploaded yet
  // Or handle a default SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1E3A5F"/></svg>`
  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  })
}
