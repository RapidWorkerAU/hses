'use client'

import * as React from 'react'

interface OrgBranding {
  brandColour: string
  logoUrl:     string | null
  loading:     boolean
}

export function useOrgBranding(): OrgBranding {
  const [brandColour, setBrandColour] = React.useState('#2d9692')
  const [logoUrl,     setLogoUrl]     = React.useState<string | null>(null)
  const [loading,     setLoading]     = React.useState(true)

  React.useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/settings/branding')
        if (res.ok) {
          const data = (await res.json()) as { brand_colour: string; logo_url: string | null }
          setBrandColour(data.brand_colour ?? '#2d9692')
          setLogoUrl(data.logo_url ?? null)
        }
      } catch {
        // silently fall back to default colour
      } finally {
        setLoading(false)
      }
    }

    load()
    window.addEventListener('org-updated', load)
    return () => window.removeEventListener('org-updated', load)
  }, [])

  return { brandColour, logoUrl, loading }
}
