import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Case à cocher — consentement RGPD, options. */
export function Checkbox({
  id,
  error,
  className,
  children,
  ...rest
}: {
  id: string
  error?: string
  children: ReactNode
} & ComponentPropsWithRef<'input'>) {
  return (
    <div className={cn('mb-5', className)}>
      <label
        htmlFor={id}
        className="text-ink-soft flex items-start gap-3 text-[0.9063rem] leading-normal"
      >
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="accent-orange mt-0.5 size-5 flex-none"
          {...rest}
        />
        <span>{children}</span>
      </label>
      {error ? (
        <span
          id={`${id}-error`}
          role="alert"
          className="text-caption text-error mt-1 block font-semibold"
        >
          {error}
        </span>
      ) : null}
    </div>
  )
}
