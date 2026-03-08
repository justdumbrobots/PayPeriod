import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#162447] rounded-2xl p-4 ${onClick ? 'cursor-pointer active:scale-98 transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  valueColor?: string
  icon?: React.ReactNode
  className?: string
}

export function MetricCard({ label, value, valueColor = '#E0E0E0', icon, className = '' }: MetricCardProps) {
  return (
    <Card className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#90CAF9] uppercase tracking-wider font-medium">{label}</span>
        {icon && <span className="text-[#64B5F6] opacity-70">{icon}</span>}
      </div>
      <span className="text-xl font-bold" style={{ color: valueColor }}>
        {value}
      </span>
    </Card>
  )
}
