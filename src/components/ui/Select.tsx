'use client'

import * as React from 'react'
import { IconAlertCircle, IconChevronDown } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

/**
 * Select — styled native select with label, helper/error messages, and a
 * custom chevron icon replacing the browser default arrow.
 *
 * @prop label              - Label text rendered above the select.
 * @prop helper             - Small grey helper text below. Shown when no error.
 * @prop error              - Red error message below. Takes priority over helper.
 * @prop optional           - Renders "(optional)" tag inline with the label.
 * @prop placeholder        - Text for the first disabled option (e.g. "Select an option").
 * @prop options            - Array of { value: string; label: string } objects.
 * @prop containerClassName - className applied to the outer wrapper div.
 */

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:              string
  helper?:             string
  error?:              string
  optional?:           boolean
  placeholder?:        string
  options?:            SelectOption[]
  containerClassName?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helper,
      error,
      optional = false,
      placeholder,
      options = [],
      containerClassName,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const hasBelow = !!(error || helper)

    return (
      <div className={cn('flex flex-col gap-[5px]', containerClassName)}>

        {/* Label row */}
        {label && (
          <div className="flex items-center gap-1">
            <label className="text-[13px] font-medium text-neutral-900">{label}</label>
            {optional && (
              <span className="text-[11px] font-normal text-neutral-400">(optional)</span>
            )}
          </div>
        )}

        {/* Select wrapper — relative for chevron positioning */}
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              'h-[40px] w-full rounded-md border border-neutral-200 bg-white',
              'pl-3 pr-8 text-[14px] text-neutral-900',
              'appearance-none cursor-pointer outline-none transition-colors duration-150',
              'hover:border-neutral-400',
              'focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20',
              // Disabled state
              disabled && 'bg-neutral-50 text-neutral-400 cursor-not-allowed border-neutral-100 hover:border-neutral-100 focus:border-neutral-100',
              // Error state
              error && 'border-danger-500 hover:border-danger-500 focus:border-danger-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {children ?? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom chevron — pointer-events-none so clicks pass through to select */}
          <span className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-neutral-400">
            <IconChevronDown size={16} />
          </span>
        </div>

        {/* Below row: error or helper */}
        {hasBelow && (
          <div>
            {error ? (
              <p className="flex items-center gap-1 text-[12px] text-danger-500">
                <IconAlertCircle size={13} className="flex-shrink-0" />
                <span>{error}</span>
              </p>
            ) : helper ? (
              <p className="text-[12px] text-neutral-500">{helper}</p>
            ) : null}
          </div>
        )}

      </div>
    )
  }
)

Select.displayName = 'Select'
