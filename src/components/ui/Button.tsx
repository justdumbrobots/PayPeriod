import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed no-select'

  const variants = {
    primary:   'bg-[#64B5F6] text-[#1B1B2F] hover:bg-[#90CAF9]',
    secondary: 'bg-[#1F4068] text-[#E0E0E0] hover:bg-[#1F4068]/80',
    outline:   'border border-[#64B5F6] text-[#64B5F6] hover:bg-[#64B5F6]/10',
    ghost:     'text-[#90CAF9] hover:bg-[#1F4068]/50',
    danger:    'bg-[#EF5350]/20 text-[#EF5350] border border-[#EF5350]/30 hover:bg-[#EF5350]/30',
  }

  const sizes = {
    sm: 'text-sm px-3 py-2 min-h-[36px]',
    md: 'text-base px-4 py-3 min-h-[44px]',
    lg: 'text-lg px-6 py-4 min-h-[52px]',
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </span>
      ) : children}
    </button>
  )
}
