'use client'

import * as React from 'react'
import { IconUpload, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { fetchAdmin } from '@/app/admin/lib/adminFetch'

const PRESET_COLOURS = [
  '#2d9692', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#ef4444', '#22c55e', '#1a2533',
]

interface BrandingData {
  brand_colour: string
  logo_url:     string | null
}

export function OrgSettingsForm() {
  const [brandColour,    setBrandColour]    = React.useState('#2d9692')
  const [hexInput,       setHexInput]       = React.useState('#2d9692')
  const [logoFile,       setLogoFile]       = React.useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = React.useState<string>('')
  const [removeLogo,     setRemoveLogo]     = React.useState(false)
  const [loading,        setLoading]        = React.useState(false)
  const [fetchLoading,   setFetchLoading]   = React.useState(true)
  const [saved,          setSaved]          = React.useState(false)
  const [error,          setError]          = React.useState('')

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Load current settings
  React.useEffect(() => {
    fetchAdmin('/api/admin/settings/branding')
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as BrandingData
          const colour = data.brand_colour ?? '#2d9692'
          setBrandColour(colour)
          setHexInput(colour)
          if (data.logo_url) setLogoPreviewUrl(data.logo_url)
        }
      })
      .catch(() => {})
      .finally(() => setFetchLoading(false))
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreviewUrl(URL.createObjectURL(file))
    setRemoveLogo(false)
  }

  function handleRemoveLogo() {
    setLogoFile(null)
    setLogoPreviewUrl('')
    setRemoveLogo(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleColourSelect(colour: string) {
    setBrandColour(colour)
    setHexInput(colour)
  }

  function handleHexBlur() {
    if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
      setBrandColour(hexInput)
    } else {
      setHexInput(brandColour)
    }
  }

  async function handleSave() {
    setLoading(true)
    setSaved(false)
    setError('')

    let logoBase64:    string | undefined
    let logoMimeType:  string | undefined
    let logoExtension: string | undefined

    if (logoFile) {
      const buffer  = await logoFile.arrayBuffer()
      const bytes   = new Uint8Array(buffer)
      let binary    = ''
      bytes.forEach((b) => { binary += String.fromCharCode(b) })
      logoBase64    = btoa(binary)
      logoMimeType  = logoFile.type
      logoExtension = logoFile.name.split('.').pop()
    }

    const body: Record<string, unknown> = { brand_colour: brandColour }
    if (removeLogo)                                              body.remove_logo     = true
    if (logoBase64 && logoMimeType && logoExtension) {
      body.logo_base64    = logoBase64
      body.logo_mime_type = logoMimeType
      body.logo_extension = logoExtension
    }

    const res = await fetchAdmin('/api/admin/settings/branding', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    if (!res.ok) {
      const msg = await res.text()
      setError(msg || 'Unable to save settings.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      window.dispatchEvent(new Event('org-updated'))
    }
    setLoading(false)
  }

  const showLogo = Boolean(logoPreviewUrl) && !removeLogo

  if (fetchLoading) {
    return <div className="text-[13px] text-neutral-400">Loading settings…</div>
  }

  return (
    <div className="w-full max-w-2xl">
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-[10px] text-[13px] text-rose-700">
          {error}
        </div>
      )}

      {/* Branding section */}
      <div className="mb-7">
        <h3 className="text-[14px] font-semibold text-neutral-900 mb-[2px]">Branding</h3>
        <p className="text-[12px] text-neutral-500 mb-4">Your logo and brand colour appear in the sidebar</p>

        {/* Logo */}
        <div className="mb-5">
          <p className="text-[13px] font-medium text-neutral-900 mb-3">Logo</p>
          <div className="flex items-center gap-4">
            {showLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreviewUrl}
                alt="HSES logo"
                className="w-[52px] h-[52px] rounded-lg object-contain border border-neutral-200 bg-white p-1 flex-shrink-0"
              />
            ) : (
              <div
                className="w-[52px] h-[52px] rounded-lg flex items-center justify-center text-white text-[20px] font-bold flex-shrink-0"
                style={{ backgroundColor: brandColour }}
              >
                H
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="neutral"
                size="sm"
                iconLeft={<IconUpload size={13} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload logo
              </Button>
              {showLogo && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<IconX size={13} />}
                  onClick={handleRemoveLogo}
                  className="text-neutral-500"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/svg+xml,image/jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-[11px] text-neutral-400 mt-2">PNG, SVG or JPG. Max 2 MB.</p>
        </div>

        {/* Brand colour */}
        <div>
          <p className="text-[13px] font-medium text-neutral-900 mb-3">Brand colour</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_COLOURS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleColourSelect(c)}
                className={cn(
                  'w-[28px] h-[28px] rounded-full transition-all duration-150',
                  brandColour === c && 'ring-2 ring-offset-2 ring-accent-500',
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-[32px] h-[32px] rounded-md border border-neutral-200 flex-shrink-0"
              style={{ backgroundColor: brandColour }}
            />
            <Input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={handleHexBlur}
              maxLength={7}
              placeholder="#2d9692"
              className="!h-9 w-[110px]"
            />
            <span className="text-[12px] text-neutral-400">Enter a hex code or pick a preset</span>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex flex-col-reverse md:flex-row md:justify-end items-stretch md:items-center gap-2 pt-4 border-t border-neutral-100">
        <Button
          variant="primary"
          loading={loading}
          loadingText="Saving…"
          success={saved}
          successText="Saved"
          onClick={handleSave}
          className="w-full md:w-auto"
        >
          Save changes
        </Button>
      </div>
    </div>
  )
}
