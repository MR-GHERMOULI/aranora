import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Helper to fetch Google Font safely with timeout
async function fetchFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2s timeout
    
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (response.ok) {
      return await response.arrayBuffer()
    }
  } catch (err) {
    console.error(`Failed to fetch font from ${url}:`, err)
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Parse query parameters
    const title = searchParams.get('title') || 'Freelancer Management Platform'
    const subtitle = searchParams.get('subtitle') || 'Streamline clients, projects, contracts, invoices, and time tracking.'
    const badge = searchParams.get('badge') || 'PLATFORM'
    const type = searchParams.get('type') || 'general'
    const progressVal = searchParams.get('progress') || '85'
    const ownerName = searchParams.get('owner') || ''
    
    // Quick branding query to Supabase (bypassing RLS with service role key if available)
    let siteName = 'Aranora'
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'branding')
        .single()
      if (data?.value?.site_name) {
        siteName = data.value.site_name
      }
    } catch (dbErr) {
      console.error("OG Image dynamic branding fetch error:", dbErr)
    }

    // Try fetching premium Inter fonts for gorgeous typography
    const fontDataMedium = await fetchFont(
      'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hA.woff'
    )
    const fontDataBold = await fetchFont(
      'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hA.woff'
    )

    const fonts = []
    if (fontDataMedium) {
      fonts.push({
        name: 'Inter',
        data: fontDataMedium,
        style: 'normal' as const,
        weight: 500 as const,
      })
    }
    if (fontDataBold) {
      fonts.push({
        name: 'Inter',
        data: fontDataBold,
        style: 'normal' as const,
        weight: 700 as const,
      })
    }

    // Colors mapping based on the page type
    let accentColor = '#4f46e5' // Indigo for general
    let accentGradient = 'linear-gradient(to right, #4f46e5, #6366f1)'
    if (type === 'contract') {
      accentColor = '#10b981' // Emerald
      accentGradient = 'linear-gradient(to right, #10b981, #34d399)'
    } else if (type === 'project') {
      accentColor = '#0ea5e9' // Sky
      accentGradient = 'linear-gradient(to right, #0ea5e9, #38bdf8)'
    } else if (type === 'intake') {
      accentColor = '#f59e0b' // Amber
      accentGradient = 'linear-gradient(to right, #f59e0b, #fbbf24)'
    } else if (type === 'blog') {
      accentColor = '#ec4899' // Pink
      accentGradient = 'linear-gradient(to right, #ec4899, #f472b6)'
    }

    // Build the TSX structure
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#070a13',
            padding: '50px',
            boxSizing: 'border-box',
            fontFamily: fontDataMedium ? 'Inter, sans-serif' : 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle elegant radial background glow */}
          <div
            style={{
              position: 'absolute',
              top: '-150px',
              right: '-150px',
              width: '600px',
              height: '600px',
              borderRadius: '300px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%)',
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-200px',
              left: '-200px',
              width: '600px',
              height: '600px',
              borderRadius: '300px',
              background: `radial-gradient(circle, ${accentColor}0e 0%, ${accentColor}00 70%)`,
              display: 'flex',
            }}
          />

          {/* Premium Grid Pattern Layout */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.04,
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              display: 'flex',
            }}
          />

          {/* Outer Glassmorphism Wrapper */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '1100px',
              height: '530px',
              backgroundColor: 'rgba(11, 17, 32, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Left Column (Meta Info) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1.3,
                padding: '48px',
                boxSizing: 'border-box',
              }}
            >
              {/* Top - Branding */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* SVG Brand Logo Icon */}
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ marginRight: '12px' }}
                >
                  <rect width="100" height="100" rx="22" fill={accentColor} />
                  <path
                    d="M30 70L50 30L70 70H58L50 52L42 70H30Z"
                    fill="#ffffff"
                  />
                  <circle cx="50" cy="30" r="6" fill="#ffffff" />
                </svg>
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: '28px',
                    fontWeight: 700,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {siteName}
                </span>
              </div>

              {/* Middle - Content Description */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginTop: '20px',
                  marginBottom: '20px',
                }}
              >
                {/* Glowing Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignSelf: 'flex-start',
                    padding: '6px 14px',
                    borderRadius: '100px',
                    backgroundColor: `${accentColor}18`,
                    border: `1px solid ${accentColor}40`,
                    marginBottom: '18px',
                  }}
                >
                  <span
                    style={{
                      color: accentColor,
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {badge}
                  </span>
                </div>

                {/* Big Page Title */}
                <h1
                  style={{
                    color: '#ffffff',
                    fontSize: '44px',
                    fontWeight: 700,
                    lineHeight: 1.15,
                    letterSpacing: '-1px',
                    margin: 0,
                    marginBottom: '14px',
                  }}
                >
                  {title}
                </h1>

                {/* Description */}
                <p
                  style={{
                    color: '#94a3b8',
                    fontSize: '18px',
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {subtitle}
                </p>
              </div>

              {/* Bottom - Domain url / watermark */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                  }}
                >
                  Powered by {siteName} &bull; The Professional Freelancer OS
                </span>
              </div>
            </div>

            {/* Right Column (High-Fidelity Mock UI) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 0.9,
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '40px',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              {/* Subtle visual grid behind mock */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.02,
                  backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* PROJECT TYPE MOCK: Radial progress ring + mini-stat */}
              {type === 'project' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'rgba(30, 41, 59, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '20px',
                    padding: '30px',
                    width: '320px',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '160px',
                      height: '160px',
                      marginBottom: '20px',
                    }}
                  >
                    {/* SVG Progress Circle */}
                    <svg width="160" height="160" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={accentColor}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * Math.min(Math.max(parseInt(progressVal) || 0, 0), 100)) / 100}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div
                      style={{
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          color: '#ffffff',
                          fontSize: '32px',
                          fontWeight: 700,
                        }}
                      >
                        {progressVal}%
                      </span>
                      <span
                        style={{
                          color: '#64748b',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                        }}
                      >
                        DONE
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      color: '#e2e8f0',
                      fontSize: '16px',
                      fontWeight: 600,
                      marginBottom: '6px',
                    }}
                  >
                    Project Tracker
                  </span>
                  <span
                    style={{
                      color: '#64748b',
                      fontSize: '13px',
                      textAlign: 'center',
                    }}
                  >
                    Real-time Milestone Monitoring
                  </span>
                </div>
              )}

              {/* CONTRACT TYPE MOCK: Stylized document with digital seal */}
              {type === 'contract' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(30, 41, 59, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '20px',
                    padding: '24px',
                    width: '320px',
                    height: '340px',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Tiny Document Header Lines */}
                    <div
                      style={{
                        display: 'flex',
                        height: '16px',
                        width: '90px',
                        backgroundColor: '#334155',
                        borderRadius: '4px',
                        marginBottom: '16px',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        height: '10px',
                        width: '100%',
                        backgroundColor: '#1e293b',
                        borderRadius: '2px',
                        marginBottom: '8px',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        height: '10px',
                        width: '85%',
                        backgroundColor: '#1e293b',
                        borderRadius: '2px',
                        marginBottom: '8px',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        height: '10px',
                        width: '90%',
                        backgroundColor: '#1e293b',
                        borderRadius: '2px',
                        marginBottom: '8px',
                      }}
                    />
                  </div>

                  {/* Smart Seal / Signature Box */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px dashed rgba(16, 185, 129, 0.3)',
                      borderRadius: '12px',
                      padding: '16px',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        marginBottom: '8px',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span
                      style={{
                        color: '#10b981',
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        marginBottom: '2px',
                      }}
                    >
                      Verified E-Sign
                    </span>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      {ownerName ? `Requested by ${ownerName}` : 'Secured via SSL'}
                    </span>
                  </div>
                </div>
              )}

              {/* INTAKE FORM TYPE MOCK: Checklist */}
              {type === 'intake' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(30, 41, 59, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '20px',
                    padding: '24px',
                    width: '320px',
                  }}
                >
                  <span
                    style={{
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 700,
                      marginBottom: '16px',
                    }}
                  >
                    Onboarding Steps
                  </span>

                  {/* Checklist Rows */}
                  {[
                    { label: 'Client Details', checked: true },
                    { label: 'Project Scope Brief', checked: true },
                    { label: 'Files & Asset Upload', checked: false },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: row.checked
                            ? `1px solid ${accentColor}`
                            : '1px solid rgba(255,255,255,0.15)',
                          backgroundColor: row.checked ? accentColor : 'transparent',
                          marginRight: '12px',
                        }}
                      >
                        {row.checked && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span
                        style={{
                          color: row.checked ? '#94a3b8' : '#e2e8f0',
                          fontSize: '13px',
                          fontWeight: row.checked ? 500 : 600,
                          textDecoration: row.checked ? 'line-through' : 'none',
                        }}
                      >
                        {row.label}
                      </span>
                    </div>
                  ))}

                  <div
                    style={{
                      display: 'flex',
                      height: '36px',
                      backgroundColor: `${accentColor}15`,
                      border: `1px solid ${accentColor}30`,
                      borderRadius: '10px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '8px',
                    }}
                  >
                    <span
                      style={{
                        color: accentColor,
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      Awaiting Response
                    </span>
                  </div>
                </div>
              )}

              {/* BLOG / DEFAULT GENERAL MOCK: Rich metric cards */}
              {(type === 'blog' || type === 'general') && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    width: '320px',
                  }}
                >
                  {/* Card 1 */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        border: '1px solid rgba(79, 70, 229, 0.2)',
                        marginRight: '16px',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>
                        ACTIVE CONTRACTS
                      </span>
                      <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700 }}>
                        99.8% Completion
                      </span>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        backgroundColor: `rgba(16, 185, 129, 0.1)`,
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        marginRight: '16px',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>
                        SMART INVOICING
                      </span>
                      <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700 }}>
                        Instant Payments
                      </span>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        backgroundColor: `rgba(14, 165, 233, 0.1)`,
                        border: '1px solid rgba(14, 165, 233, 0.2)',
                        marginRight: '16px',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>
                        INTEGRATED TRACKING
                      </span>
                      <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700 }}>
                        Automated Timesheets
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts,
      }
    )
  } catch (error: any) {
    console.error('OG Image generation server error:', error)
    // Fallback: simple text-based error response or standard fallback image in PNG/SVG
    return new Response(`Error generating OG Image: ${error?.message || error}`, {
      status: 500,
    })
  }
}
