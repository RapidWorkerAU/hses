'use client'

import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as Checkbox from '@radix-ui/react-checkbox'
import {
  IconChevronDown,
  IconX,
  IconSearch,
  IconSearchOff,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

/**
 * Dropdown — searchable single-select or multi-select dropdown built on
 * Radix UI Popover for accessible panel positioning.
 *
 * Scroll is auto-enabled at 8+ options (max-h-[200px], min-h-[148px]).
 * Search is auto-enabled at 16+ options regardless of the searchable prop.
 *
 * @prop label            - Label rendered above the trigger.
 * @prop helper           - Small grey helper text below.
 * @prop error            - Red error message below. Replaces helper when present.
 * @prop optional         - Renders "(optional)" inline with the label.
 * @prop placeholder      - Shown when no option is selected. Default: "Select an option...".
 * @prop options          - Array of { value, label, group? }. Options with the same group
 *                          string are rendered under a shared group header.
 * @prop value            - Controlled value. String for single, string[] for multi.
 * @prop onChange         - Called with the new value on every selection change.
 * @prop multiple         - Enables multi-select mode. Default: false.
 * @prop searchable       - Manually force search on/off. Auto-enabled at 16+ options
 *                          regardless of this prop.
 * @prop searchPlaceholder - Placeholder for the search input. Default: "Search...".
 * @prop clearable        - Shows an ✕ button to clear the selection. Default: true.
 * @prop selectAll        - Shows a "Select all" row in multi mode. Default: false.
 * @prop disabled         - Disables the trigger and prevents opening.
 * @prop containerClassName - className on the outer wrapper div.
 * @prop maxDisplay       - Max number of pills shown in multi mode before "+N more". Default: 3.
 * @prop autoWidth        - When true, panel expands to fit content width
 *                          (min: trigger width, max: 320px). Use for inline table cell
 *                          dropdowns. Default: false.
 */

export interface DropdownOption {
  value: string
  label: string
  group?: string
}

export interface DropdownProps {
  label?:             string
  helper?:            string
  error?:             string
  optional?:          boolean
  placeholder?:       string
  options?:           DropdownOption[]
  value?:             string | string[]
  onChange?:          (value: string | string[]) => void
  multiple?:          boolean
  searchable?:        boolean
  searchPlaceholder?: string
  clearable?:         boolean
  selectAll?:         boolean
  disabled?:          boolean
  containerClassName?: string
  maxDisplay?:        number
  autoWidth?:         boolean
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      label,
      helper,
      error,
      optional = false,
      placeholder = 'Select an option...',
      options = [],
      value,
      onChange,
      multiple = false,
      searchable = true,
      searchPlaceholder = 'Search...',
      clearable = true,
      selectAll = false,
      disabled = false,
      containerClassName,
      maxDisplay = 3,
      autoWidth = false,
    },
    ref
  ) => {
    const [open, setOpen]               = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const searchRef = React.useRef<HTMLInputElement>(null)

    // ── Derived values ──────────────────────────────────────────────────────

    const selectedValues: string[] = multiple
      ? Array.isArray(value) ? value : []
      : []

    const singleValue: string = !multiple && typeof value === 'string' ? value : ''

    const hasValue = multiple ? selectedValues.length > 0 : singleValue !== ''

    const filteredOptions = React.useMemo(() => {
      if (!searchQuery.trim()) return options
      const q = searchQuery.toLowerCase()
      return options.filter(opt => opt.label.toLowerCase().includes(q))
    }, [options, searchQuery])

    // Ordered unique group names (preserving first-appearance order)
    const groupNames = React.useMemo(
      () => [...new Set(filteredOptions.filter(o => o.group).map(o => o.group!))],
      [filteredOptions]
    )
    const ungrouped = filteredOptions.filter(o => !o.group)

    // Multi select-all state
    const allFilteredSelected =
      filteredOptions.length > 0 &&
      filteredOptions.every(o => selectedValues.includes(o.value))
    const someFilteredSelected = filteredOptions.some(o => selectedValues.includes(o.value))

    // Pills for multi trigger
    const selectedOptions = options.filter(o => selectedValues.includes(o.value))
    const displayedPills  = selectedOptions.slice(0, maxDisplay)
    const overflowCount   = selectedOptions.length - displayedPills.length

    // ── Handlers ────────────────────────────────────────────────────────────

    function handleSelect(optionValue: string) {
      if (multiple) {
        const next = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue]
        onChange?.(next)
      } else {
        onChange?.(optionValue)
        setOpen(false)
      }
    }

    function handleSelectAll() {
      if (allFilteredSelected) {
        onChange?.(selectedValues.filter(v => !filteredOptions.find(o => o.value === v)))
      } else {
        const toAdd = filteredOptions.map(o => o.value)
        onChange?.([...new Set([...selectedValues, ...toAdd])])
      }
    }

    function handleClear(e: React.MouseEvent) {
      e.stopPropagation()
      onChange?.(multiple ? [] : '')
    }

    function handleRemovePill(pillValue: string, e: React.MouseEvent) {
      e.stopPropagation()
      onChange?.(selectedValues.filter(v => v !== pillValue))
    }

    function handleOpenChange(next: boolean) {
      setOpen(next)
      if (!next) setSearchQuery('')
    }

    // ── Subcomponents ────────────────────────────────────────────────────────

    function RadioIndicator({ selected }: { selected: boolean }) {
      return (
        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-neutral-200">
          {selected && <span className="h-2 w-2 rounded-full bg-accent-500" />}
        </span>
      )
    }

    function CheckboxIndicator({ checked }: { checked: boolean }) {
      return (
        <Checkbox.Root
          checked={checked}
          className={cn(
            'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-colors',
            checked ? 'bg-accent-500 border-accent-500' : 'bg-white border-neutral-200'
          )}
          onCheckedChange={() => {}}
          tabIndex={-1}
          aria-hidden
        >
          <Checkbox.Indicator className="flex items-center justify-center">
            <IconCheck size={10} className="text-white" />
          </Checkbox.Indicator>
        </Checkbox.Root>
      )
    }

    function OptionRow({ opt }: { opt: DropdownOption }) {
      const selected = multiple
        ? selectedValues.includes(opt.value)
        : singleValue === opt.value

      return (
        <div
          role="option"
          aria-selected={selected}
          tabIndex={0}
          onClick={() => handleSelect(opt.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSelect(opt.value) }}
          className={cn(
            'flex cursor-pointer items-center gap-[10px] px-3 py-[9px] text-[14px] text-neutral-900',
            'outline-none transition-colors duration-100',
            'hover:bg-neutral-50',
            selected && 'bg-accent-50 text-accent-700'
          )}
        >
          {multiple
            ? <CheckboxIndicator checked={selected} />
            : <RadioIndicator selected={selected} />
          }
          {opt.label}
        </div>
      )
    }

    // ── Trigger border reflects open/error state ─────────────────────────────

    const triggerBorderClass = error
      ? 'border-danger-500'
      : open
      ? 'border-accent-500'
      : 'border-neutral-200'

    const singleLabel = options.find(o => o.value === singleValue)?.label

    // Auto-behaviour thresholds: search at 16+, scroll at 8+
    const optionCount  = options.length
    const isSearchable = searchable || optionCount >= 16
    const isScrollable = optionCount >= 8

    // ── Render ───────────────────────────────────────────────────────────────

    return (
      <div className={cn('flex flex-col gap-[5px]', containerClassName)} ref={ref}>

        {/* Label */}
        {label && (
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-medium text-neutral-900">{label}</span>
            {optional && (
              <span className="text-[11px] font-normal text-neutral-400">(optional)</span>
            )}
          </div>
        )}

        {/* Popover */}
        <Popover.Root open={open} onOpenChange={handleOpenChange}>

          {/* Trigger */}
          <Popover.Trigger asChild disabled={disabled}>
            <div
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-disabled={disabled}
              className={cn(
                'relative w-full cursor-pointer select-none rounded-md border bg-white',
                'transition-colors duration-150',
                multiple
                  ? 'flex min-h-[40px] flex-wrap items-center gap-1 py-[6px] pl-[8px] pr-[36px]'
                  : 'flex h-[40px] items-center px-3 pr-[64px] text-[14px]',
                triggerBorderClass,
                disabled && 'cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-400'
              )}
            >
              {/* Multi: pills */}
              {multiple && (
                <>
                  {selectedOptions.length === 0 && (
                    <span className="text-[14px] text-neutral-400">{placeholder}</span>
                  )}
                  {displayedPills.map(opt => (
                    <span
                      key={opt.value}
                      className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-[3px] text-[12px] font-medium text-neutral-700"
                    >
                      {opt.label}
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={e => handleRemovePill(opt.value, e)}
                        className="ml-[2px] text-neutral-500 hover:text-neutral-900 transition-colors"
                        aria-label={`Remove ${opt.label}`}
                      >
                        <IconX size={11} />
                      </button>
                    </span>
                  ))}
                  {overflowCount > 0 && (
                    <span className="text-[12px] text-neutral-500">+{overflowCount} more</span>
                  )}
                </>
              )}

              {/* Single: label or placeholder */}
              {!multiple && (
                <span className={singleLabel ? 'text-neutral-900' : 'text-neutral-400'}>
                  {singleLabel ?? placeholder}
                </span>
              )}

              {/* Clear button */}
              {clearable && hasValue && !disabled && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleClear}
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors',
                    multiple ? 'right-[28px]' : 'right-[30px]'
                  )}
                  aria-label="Clear selection"
                >
                  <IconX size={14} />
                </button>
              )}

              {/* Chevron */}
              <span className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-neutral-400">
                <IconChevronDown
                  size={16}
                  className={cn('transition-transform duration-150', open && 'rotate-180')}
                />
              </span>
            </div>
          </Popover.Trigger>

          {/* Panel */}
          <Popover.Portal>
            <Popover.Content
              sideOffset={4}
              align="start"
              onOpenAutoFocus={e => {
                e.preventDefault()
                if (isSearchable) searchRef.current?.focus()
              }}
              style={
                autoWidth
                  ? { minWidth: 'var(--radix-popover-trigger-width)', width: 'max-content', maxWidth: '320px' }
                  : { width: 'var(--radix-popover-trigger-width)' }
              }
              className={cn(
                'z-[60] overflow-hidden rounded-md border border-neutral-200 bg-white',
                'shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
              )}
            >

              {/* Search input */}
              {isSearchable && (
                <div className="border-b border-neutral-100 p-2">
                  <div className="relative">
                    <IconSearch
                      size={14}
                      className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      className={cn(
                        'h-[34px] w-full rounded-sm border border-neutral-200 bg-neutral-50',
                        'pl-[28px] pr-2 text-[13px] text-neutral-900 outline-none',
                        'focus:border-accent-500 focus:bg-white transition-colors'
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Select all row */}
              {multiple && selectAll && (
                <div
                  role="option"
                  tabIndex={0}
                  onClick={handleSelectAll}
                  onKeyDown={e => { if (e.key === 'Enter') handleSelectAll() }}
                  className="flex cursor-pointer items-center gap-[10px] border-b border-neutral-100 px-3 py-2 text-[13px] font-medium text-neutral-500 outline-none hover:bg-neutral-50"
                >
                  <CheckboxIndicator checked={allFilteredSelected || (someFilteredSelected ? false : false)} />
                  Select all
                </div>
              )}

              {/* Options list */}
              <div role="listbox" className={cn(
                'overflow-y-auto',
                isScrollable ? 'max-h-[200px] min-h-[148px]' : ''
              )}>
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-5 text-center text-[13px] text-neutral-400">
                    <IconSearchOff size={20} className="mx-auto mb-2 block" />
                    No results for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <>
                    {/* Ungrouped options first */}
                    {ungrouped.map(opt => <OptionRow key={opt.value} opt={opt} />)}

                    {/* Grouped options */}
                    {groupNames.map(group => (
                      <div key={group}>
                        <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-400">
                          {group}
                        </div>
                        {filteredOptions
                          .filter(o => o.group === group)
                          .map(opt => <OptionRow key={opt.value} opt={opt} />)}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Multi footer */}
              {multiple && selectedValues.length > 0 && (
                <div className="flex items-center justify-between border-t border-neutral-100 px-3 py-2 text-[12px] text-neutral-500">
                  <span>{selectedValues.length} selected</span>
                  <button
                    type="button"
                    onClick={() => onChange?.([])}
                    className="font-medium text-accent-500 hover:text-accent-700 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}

            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Below: error or helper */}
        {(error || helper) && (
          <div>
            {error ? (
              <p className="flex items-center gap-1 text-[12px] text-danger-500">
                <IconAlertCircle size={13} className="flex-shrink-0" />
                <span>{error}</span>
              </p>
            ) : (
              <p className="text-[12px] text-neutral-500">{helper}</p>
            )}
          </div>
        )}

      </div>
    )
  }
)

Dropdown.displayName = 'Dropdown'
