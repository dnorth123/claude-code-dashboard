import type { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  icon?: ReactNode
  className?: string
}

export const StatCard: FC<StatCardProps> = ({ label, value, icon, className }) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-1 text-2xl font-semibold text-card-foreground">
        {value}
      </p>
    </div>
  )
}
