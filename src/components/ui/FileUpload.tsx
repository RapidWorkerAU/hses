'use client'

import * as React from 'react'
import { IconUpload, IconFile, IconX, IconDownload, IconLoader2 } from '@tabler/icons-react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export interface FileUploadResult {
  filePath: string
  fileName: string
  fileSize: number
}

interface Props {
  bucket:           string
  storagePath:      string        // folder path, e.g. "org_id/doc_id"
  currentFilePath?: string | null // path stored in DB (used to generate signed URL)
  currentFileName?: string | null
  currentFileSize?: number | null
  onUploadComplete: (result: FileUploadResult) => void
  onRemove:         () => void
  accept?:          string
  maxSizeMB?:       number
  disabled?:        boolean
  label?:           string
}

function fmtFileSize(bytes: number) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  bucket,
  storagePath,
  currentFilePath,
  currentFileName,
  currentFileSize,
  onUploadComplete,
  onRemove,
  accept,
  maxSizeMB = 50,
  disabled = false,
  label,
}: Props) {
  const supabase         = supabaseBrowser
  const inputRef         = React.useRef<HTMLInputElement>(null)
  const [uploading,      setUploading]      = React.useState(false)
  const [error,          setError]          = React.useState('')
  const [signedUrl,      setSignedUrl]      = React.useState<string | null>(null)
  const [dragging,       setDragging]       = React.useState(false)

  // Generate a signed URL whenever the stored path changes
  React.useEffect(() => {
    if (!currentFilePath) { setSignedUrl(null); return }
    // If it looks like a full URL already (legacy / public bucket), use it directly
    if (currentFilePath.startsWith('http')) { setSignedUrl(currentFilePath); return }
    supabase.storage
      .from(bucket)
      .createSignedUrl(currentFilePath, 3600)
      .then(({ data }) => setSignedUrl((data as { signedUrl?: string } | null)?.signedUrl ?? null))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilePath, bucket])

  async function upload(file: File) {
    setError('')
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB} MB.`)
      return
    }

    setUploading(true)
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path      = `${storagePath}/${sanitized}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    setUploading(false)

    if (uploadError) {
      setError(uploadError.message)
      return
    }

    onUploadComplete({ filePath: path, fileName: file.name, fileSize: file.size })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const hasFile = Boolean(currentFilePath)

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-[13px] font-medium text-neutral-700">{label}</p>
      )}

      {hasFile ? (
        /* Existing file — show info + download + remove */
        <div className="flex items-center justify-between gap-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-accent-50 border border-accent-100 flex items-center justify-center flex-shrink-0">
              <IconFile size={17} className="text-accent-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-neutral-800 truncate">
                {currentFileName ?? 'Document'}
              </p>
              {currentFileSize != null && (
                <p className="text-[11px] text-neutral-400">{fmtFileSize(currentFileSize)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {signedUrl && (
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" download={currentFileName ?? undefined}>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[12px] font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-md px-2 py-[5px] transition-colors"
                >
                  <IconDownload size={13} />
                  Download
                </button>
              </a>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1 rounded text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                aria-label="Remove file"
              >
                <IconX size={15} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragEnter={e => { e.preventDefault(); if (!disabled) setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors cursor-pointer',
            dragging  ? 'border-accent-400 bg-accent-50' : 'border-neutral-200 bg-neutral-50 hover:border-accent-300 hover:bg-accent-50/40',
            (disabled || uploading) && 'pointer-events-none opacity-60',
          )}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <IconLoader2 size={22} className="text-accent-500 animate-spin" />
              <p className="text-[13px] text-neutral-500">Uploading…</p>
            </>
          ) : (
            <>
              <IconUpload size={20} className="text-neutral-400" />
              <div className="text-center">
                <p className="text-[13px] font-medium text-neutral-700">
                  Drop file here or <span className="text-accent-600">browse</span>
                </p>
                <p className="text-[11px] text-neutral-400 mt-[2px]">
                  Max {maxSizeMB} MB
                  {accept && ` · ${accept.replace(/application\//g, '').replace(/vnd\.[a-z.]+\./g, '').toUpperCase()}`}
                </p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
        </div>
      )}

      {error && (
        <p className="text-[12px] text-danger-600">{error}</p>
      )}
    </div>
  )
}
