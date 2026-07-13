'use client'

import * as React from 'react'
import { IconAlertCircle, IconCircleCheck, IconX } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

/**
 * Input — single-line text input with label, messages, icon slots,
 * prefix/suffix blocks, clear button, and character count.
 *
 * @prop label              - Label text rendered above the input.
 * @prop helper             - Small grey helper text below the input.
 * @prop error              - Red error message below. Replaces helper when present.
 * @prop successMessage     - Green success message below. Replaces helper when present.
 * @prop optional           - Renders "(optional)" tag inline with the label.
 * @prop iconLeft           - React node inside the left edge of the input.
 * @prop iconRight          - React node inside the right edge of the input.
 * @prop clearable          - Shows an ✕ button on the right when the input has a value.
 * @prop onClear            - Called when the clear button is clicked.
 * @prop prefix             - Text block attached left (e.g. "https://").
 * @prop suffix             - Text block attached right (e.g. "employees").
 * @prop showCount          - Shows "x / maxLength" counter below right. Requires maxLength.
 * @prop containerClassName - className applied to the outer wrapper div.
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:              string
  helper?:             string
  error?:              string
  successMessage?:     string
  optional?:           boolean
  iconLeft?:           React.ReactNode
  iconRight?:          React.ReactNode
  clearable?:          boolean
  onClear?:            () => void
  prefix?:             string
  suffix?:             string
  showCount?:          boolean
  containerClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helper,
      error,
      successMessage,
      optional = false,
      iconLeft,
      iconRight,
      clearable = false,
      onClear,
      prefix,
      suffix,
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

    const showClearButton =
      clearable &&
      (isControlled ? String(value).length > 0 : uncontrolledValue.length > 0)

    const hasRightAddon = !!(iconRight || showClearButton)

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (!isControlled) setUncontrolledValue(e.target.value)
      onChange?.(e)
    }

    // Border colour for prefix/suffix blocks — mirrors the input's own border state.
    const addonBorder = error
      ? 'border-danger-500'
      : successMessage
      ? 'border-success-600'
      : 'border-neutral-200 group-focus-within:border-accent-500'

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

        {/* Input row — group enables focus-within border sync on prefix/suffix */}
        <div className="group flex">

          {prefix && (
            <div
              className={cn(
                'flex items-center px-3 text-[13px] text-neutral-500',
                'bg-neutral-50 border border-r-0 rounded-l-md transition-colors duration-150',
                addonBorder
              )}
            >
              {prefix}
            </div>
          )}

          <div className="relative flex-1">
            {iconLeft && (
              <span className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-neutral-400">
                {iconLeft}
              </span>
            )}

            <input
              ref={ref}
              disabled={disabled}
              value={isControlled ? (value as string) : undefined}
              defaultValue={!isControlled ? defaultValue : undefined}
              onChange={handleChange}
              maxLength={maxLength}
              className={cn(
                'h-[40px] w-full border border-neutral-200 bg-white px-3',
                'text-[14px] text-neutral-900 outline-none transition-colors duration-150',
                'placeholder:text-neutral-400',
                'hover:border-neutral-400',
                'focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20',
                // Radius — adjusted when prefix/suffix present
                !prefix && !suffix && 'rounded-md',
                prefix && !suffix  && 'rounded-r-md rounded-l-none',
                !prefix && suffix  && 'rounded-l-md rounded-r-none',
                prefix && suffix   && 'rounded-none',
                // Icon padding
                iconLeft      && 'pl-9',
                hasRightAddon && 'pr-9',
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

            {showClearButton ? (
              <button
                type="button"
                onClick={onClear}
                tabIndex={-1}
                className="absolute right-[10px] top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors duration-150"
              >
                <IconX size={15} />
              </button>
            ) : iconRight ? (
              <span className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-neutral-400">
                {iconRight}
              </span>
            ) : null}
          </div>

          {suffix && (
            <div
              className={cn(
                'flex items-center px-3 text-[13px] text-neutral-500',
                'bg-neutral-50 border border-l-0 rounded-r-md transition-colors duration-150',
                addonBorder
              )}
            >
              {suffix}
            </div>
          )}
        </div>

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

Input.displayName = 'Input'
