import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { controlClasses, describedBy, FieldShell } from './field'

export function SelectField({
  id,
  label,
  hint,
  error,
  required,
  placeholder,
  options,
  className,
  ...rest
}: {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  placeholder?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
} & ComponentPropsWithRef<'select'>) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        defaultValue={rest.defaultValue ?? (placeholder ? '' : undefined)}
        className={cn(controlClasses, className)}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
