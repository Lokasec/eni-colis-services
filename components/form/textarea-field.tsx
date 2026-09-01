import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { controlClasses, describedBy, FieldShell } from './field'

export function TextareaField({
  id,
  label,
  hint,
  error,
  required,
  className,
  ...rest
}: {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
} & ComponentPropsWithRef<'textarea'>) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(controlClasses, 'min-h-30 resize-y leading-relaxed', className)}
        {...rest}
      />
    </FieldShell>
  )
}
