'use client'

import * as React from 'react'
import { IconX } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

/**
 * TagInput — horizontal pill-based multi-value input.
 * Press Enter or comma to add a tag; Backspace on empty input removes the last tag.
 * Fires onBlur to commit a partially-typed tag when focus leaves the control.
 */

interface Props {
  label?:       string
  optional?:    boolean
  placeholder?: string
  value:        string[]
  onChange:     (v: string[]) => void
  className?:   string
}

export function TagInput({
  label,
  optional,
  placeholder = 'Type a name and press Enter…',
  value,
  onChange,
  className,
}: Props) {
  const [draft, setDraft] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  function commit(raw: string) {
    const trimmed = raw.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(draft)
    }
    if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function remove(tag: string) {
    onChange(value.filter(t => t !== tag))
  }

  return (
    <div className={cn('flex flex-col gap-[5px]', className)}>
      {label && (
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-medium text-neutral-900">{label}</span>
          {optional && (
            <span className="text-[11px] font-normal text-neutral-400">(optional)</span>
          )}
        </div>
      )}

      <div
        className={cn(
          'flex flex-wrap gap-[6px] items-center px-3 py-[9px] rounded-md border border-neutral-200',
          'min-h-[40px] focus-within:border-accent-500 transition-colors bg-white cursor-text',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-[4px] h-[22px] px-[8px] rounded-full bg-accent-50 text-accent-700 text-[12px] font-medium flex-shrink-0"
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); remove(tag) }}
              className="text-accent-400 hover:text-accent-700 transition-colors leading-none"
              aria-label={`Remove ${tag}`}
            >
              <IconX size={10} strokeWidth={2.5} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[140px] text-[14px] text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent h-[22px]"
        />
      </div>

      <p className="text-[11px] text-neutral-400">
        Press <kbd className="font-mono">Enter</kbd> or <kbd className="font-mono">,</kbd> to add each person
      </p>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse the DB value (JSON array string or legacy plain text) into a string[]. */
export function parsePersons(raw: string | null | undefined): string[] {
  if (!raw) return []
  try   { return JSON.parse(raw) as string[] }
  catch { return raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean) }
}

/** Serialise a string[] back to the DB text column value (or null if empty). */
export function serialisePersons(tags: string[]): string | null {
  return tags.length ? JSON.stringify(tags) : null
}
