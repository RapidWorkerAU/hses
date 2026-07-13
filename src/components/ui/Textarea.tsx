'use client'

import * as React from 'react'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

/**
 * Textarea — multi-line text input with label, messages, and character count.
 *
 * @prop label              - Label text rendered above the textarea.
 * @prop helper             - Small grey helper text below. Shown when no error/success.
 * @prop error              - Red error message below. Takes priority over helper.
 * @prop successMessage     - Green success message below. Takes priority over helper.
 * @prop optional           - Renders "(optional)" tag inline with the label.
 * @prop rows               - Number of visible text rows. Default: 4.
 * @prop resize             - CSS resize behaviour: 'none' | 'vertical' | 'both'. Default: 'vertical'.
 * @prop showCount          - Shows "x / maxLength" counter below right. Requires maxLength.
 * @prop containerClassName - className applied to the outer wrapper div.
 */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:              string
  helper?:             string
  error?:              string
  successMessage?:     string
  optional?:           boolean
  rows?:               number
  resize?:             'none' | 'vertical' | 'both'
  showCount?:          boolean
  containerClassName?: string
}

const resizeClass: Record<'none' | 'vertical' | 'both', string> = {
  none:     'resize-none',
  vertical: 'resize-y',
  both:     'resize',
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helper,
      error,
      successMessage,
      optional = false,
      rows = 4,
      resize = 'vertical',
      showCount = false,
      containerClassName,
      className,
      disabled,
      value,
      defaultValue,
      onChange,
      maxLength,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined

    const [uncontrolledValue, setUncontrolledValue] = React.useState(
      defaultValue !== undefined ? String(defaultValue) : ''
    )

    const currentLength = isControlled
      ? String(value).length
      : uncontrolledValue.length

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      if (!isControlled) setUncontrolledValue(e.target.value)
      onChange?.(e)
    }

    const hasBelow =
      !!(error || successMessage || helper) ||
      (showCount && maxLength !== undefined)

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

        {/* Textarea */}
        <textarea
          ref={ref}
          rows={rows}
          disabled={disabled}
          value={isControlled ? (value as string) : undefined}
          defaultValue={!isControlled ? defaultValue : undefined}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            'w-full border border-neutral-200 rounded-md bg-white px-3 py-[10px]',
            'text-[14px] text-neutral-900 leading-relaxed outline-none transition-colors duration-150',
            'placeholder:text-neutral-400',
            'hover:border-neutral-400',
            'focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20',
            resizeClass[resize],
            // Disabled state
            disabled && 'bg-neutral-50 text-neutral-400 cursor-not-allowed border-neutral-100 hover:border-neutral-100 focus:border-neutral-100',
            // Error state
            error && 'border-danger-500 hover:border-danger-500 focus:border-danger-500',
            // Success state (only when no error)
            !error && successMessage && 'border-success-600 hover:border-success-600 focus:border-success-600',
            className
          )}
          {...props}
        />

        {/* Below row: message + character count */}
        {hasBelow && (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {error ? (
                <p className="flex items-center gap-1 text-[12px] text-danger-500">
                  <IconAlertCircle size={13} className="flex-shrink-0" />
                  <span>{error}</span>
                </p>
              ) : successMessage ? (
                <p className="flex items-center gap-1 text-[12px] text-success-600">
                  <IconCircleCheck size={13} className="flex-shrink-0" />
                  <span>{successMessage}</span>
                </p>
              ) : helper ? (
                <p className="text-[12px] text-neutral-500">{helper}</p>
              ) : null}
            </div>

            {showCount && maxLength !== undefined && (
              <p className="flex-shrink-0 text-right text-[11px] text-neutral-400">
                {currentLength} / {maxLength}
              </p>
            )}
          </div>
        )}

      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
