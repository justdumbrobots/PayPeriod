import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
  suffix?: string
}

export function Input({
  label,
  error,
  prefix,
  suffix,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-[#90CAF9] font-medium">{label}</label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-[#90CAF9] text-sm pointer-events-none">{prefix}</span>
        )}
        <input
          {...props}
          className={`
            w-full bg-[#0D2137] border border-[#1F4068] rounded-xl px-4 py-3
            text-[#E0E0E0] placeholder-[#4a6080] text-base min-h-[44px]
            focus:border-[#64B5F6] focus:ring-1 focus:ring-[#64B5F6]/30
            transition-colors
            ${prefix ? 'pl-8' : ''}
            ${suffix ? 'pr-8' : ''}
            ${error ? 'border-[#EF5350]' : ''}
            ${className}
          `}
        />
        {suffix && (
          <span className="absolute right-3 text-[#90CAF9] text-sm pointer-events-none">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-[#EF5350]">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-[#90CAF9] font-medium">{label}</label>
      )}
      <select
        {...props}
        className={`
          w-full bg-[#0D2137] border border-[#1F4068] rounded-xl px-4 py-3
          text-[#E0E0E0] text-base min-h-[44px]
          focus:border-[#64B5F6] focus:ring-1 focus:ring-[#64B5F6]/30
          transition-colors appearance-none
          ${error ? 'border-[#EF5350]' : ''}
          ${className}
        `}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[#EF5350]">{error}</p>}
    </div>
  )
}
