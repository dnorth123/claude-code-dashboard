import { type FC, useMemo } from 'react'
import { DollarSign, MessageSquare, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { formatTokens, formatCurrency } from '@/lib/utils'
import type { Session } from '@/lib/types'

interface UsageSummaryProps {
  sessions: Session[]
}

export const UsageSummary: FC<UsageSummaryProps> = ({ sessions }) => {
  const stats = useMemo(() => {
    let totalCostCents = 0
    let totalInput = 0
    let totalOutput = 0
    for (const s of sessions) {
      totalCostCents += s.estimatedCostCents
      totalInput += s.tokens.input + s.tokens.cacheCreation + s.tokens.cacheRead
      totalOutput += s.tokens.output
    }
    return { totalCostCents, totalInput, totalOutput, totalSessions: sessions.length }
  }, [sessions])

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        label="Total Cost"
        value={formatCurrency(stats.totalCostCents)}
        icon={<DollarSign className="h-4 w-4" />}
      />
      <StatCard
        label="Total Sessions"
        value={String(stats.totalSessions)}
        icon={<MessageSquare className="h-4 w-4" />}
      />
      <StatCard
        label="Input Tokens"
        value={formatTokens(stats.totalInput)}
        icon={<ArrowDownToLine className="h-4 w-4" />}
      />
      <StatCard
        label="Output Tokens"
        value={formatTokens(stats.totalOutput)}
        icon={<ArrowUpFromLine className="h-4 w-4" />}
      />
    </div>
  )
}
