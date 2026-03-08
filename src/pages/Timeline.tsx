import { useRef, useEffect, useCallback, useState } from 'react'
import { Plus, Search, X, ChevronRight } from 'lucide-react'
import { useBudgetStore } from '../stores/budgetStore'
import { useUIStore } from '../stores/uiStore'
import { formatCurrency } from '../lib/format'
import type { ComputedPeriod } from '../types'
import { PeriodDetailModal } from '../components/timeline/PeriodDetailModal'
import { ExtraItemModal } from '../components/timeline/ExtraItemModal'

const ROW_HEIGHT = 80

export function Timeline() {
  const { computedPeriods, currentPeriodIndex } = useBudgetStore()
  const { selectedPeriodIndex, setSelectedPeriod, openExtraModal, extraModalOpen, extraModalPeriodIndex } = useUIStore()
  const listRef = useRef<HTMLDivElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [jumpToIndex, setJumpToIndex] = useState<number | null>(null)

  // Auto-scroll to current period on mount
  useEffect(() => {
    if (listRef.current && currentPeriodIndex > 0) {
      const scrollPos = currentPeriodIndex * ROW_HEIGHT - 120
      listRef.current.scrollTo({ top: Math.max(0, scrollPos), behavior: 'smooth' })
    }
  }, [currentPeriodIndex])

  const handleJumpTo = useCallback(() => {
    if (jumpToIndex !== null && listRef.current) {
      const pos = jumpToIndex * ROW_HEIGHT - 120
      listRef.current.scrollTo({ top: Math.max(0, pos), behavior: 'smooth' })
      setSearchOpen(false)
      setSearchQuery('')
      setJumpToIndex(null)
    }
  }, [jumpToIndex])

  // Filter periods for search
  const filteredPeriods = searchQuery
    ? computedPeriods.filter(cp => cp.period.payDateStr.includes(searchQuery))
    : null

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-[#162447] px-4 pt-4 pb-3 safe-top border-b border-[#1F4068]">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-[#E0E0E0]">Pay Period Timeline</h1>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#1F4068] text-[#64B5F6] transition-colors"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
        </div>

        {/* Search */}
        {searchOpen && (
          <div className="fade-in">
            <input
              autoFocus
              placeholder="Search by date (e.g. 03-)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D2137] border border-[#1F4068] rounded-xl px-4 py-2 text-sm text-[#E0E0E0] placeholder-[#4a6080]"
            />
            {filteredPeriods && filteredPeriods.length > 0 && (
              <div className="mt-2 bg-[#0D2137] rounded-xl max-h-40 overflow-y-auto">
                {filteredPeriods.slice(0, 8).map(cp => (
                  <button
                    key={cp.period.index}
                    onClick={() => {
                      setJumpToIndex(cp.period.index)
                      setSearchQuery('')
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#1F4068] text-sm text-left"
                  >
                    <span className="text-[#E0E0E0]">{cp.period.payDateStr}</span>
                    <span className={`text-xs ${cp.net >= 0 ? 'text-[#66BB6A]' : 'text-[#EF5350]'}`}>
                      {formatCurrency(cp.net)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {jumpToIndex !== null && (
              <button onClick={handleJumpTo} className="mt-2 w-full text-sm text-[#64B5F6] py-2">
                Jump to period #{jumpToIndex}
              </button>
            )}
          </div>
        )}

        {/* Column headers */}
        {!searchOpen && (
          <div className="grid grid-cols-12 gap-1 text-[10px] text-[#4a6080] uppercase font-medium">
            <span className="col-span-3">Date</span>
            <span className="col-span-2 text-right text-[#EF5350]">Bills</span>
            <span className="col-span-2 text-right text-[#FFA726]">Extra</span>
            <span className="col-span-2 text-right text-[#FFD740]">Net</span>
            <span className="col-span-3 text-right text-[#4DD0E1]">Balance</span>
          </div>
        )}
      </div>

      {/* Period list */}
      <div ref={listRef} className="flex-1 overflow-y-auto smooth-scroll pb-24">
        {computedPeriods.map((cp, i) => (
          <PeriodRow
            key={cp.period.index}
            cp={cp}
            isCurrentPeriod={i === currentPeriodIndex}
            isEven={i % 2 === 0}
            onClick={() => setSelectedPeriod(cp.period.index)}
            onAddExtra={() => openExtraModal(cp.period.index)}
          />
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => openExtraModal(currentPeriodIndex)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#64B5F6] rounded-full flex items-center justify-center shadow-lg shadow-[#64B5F6]/30 active:scale-95 transition-transform z-30"
      >
        <Plus size={24} className="text-[#1B1B2F]" />
      </button>

      {/* Period Detail Modal */}
      {selectedPeriodIndex !== null && (
        <PeriodDetailModal
          periodIndex={selectedPeriodIndex}
          onClose={() => setSelectedPeriod(null)}
        />
      )}

      {/* Extra Item Modal */}
      {extraModalOpen && extraModalPeriodIndex !== null && (
        <ExtraItemModal periodIndex={extraModalPeriodIndex} />
      )}
    </div>
  )
}

interface PeriodRowProps {
  cp: ComputedPeriod
  isCurrentPeriod: boolean
  isEven: boolean
  onClick: () => void
  onAddExtra: () => void
}

function PeriodRow({ cp, isCurrentPeriod, isEven, onClick, onAddExtra }: PeriodRowProps) {
  const bgColor = isCurrentPeriod
    ? 'bg-[#1B5E20]/40 border-l-2 border-[#66BB6A]'
    : isEven
    ? 'bg-[#1F4068]/20'
    : 'bg-transparent'

  return (
    <div
      className={`${bgColor} border-b border-[#1F4068]/30 min-h-[64px]`}
      style={{ minHeight: ROW_HEIGHT }}
    >
      <div className="grid grid-cols-12 gap-1 px-4 py-3 items-center h-full" onClick={onClick}>
        {/* Date */}
        <div className="col-span-3">
          <div className="text-xs font-semibold text-[#E0E0E0] leading-tight">{cp.period.payDateStr}</div>
          {isCurrentPeriod && (
            <div className="text-[9px] text-[#66BB6A] font-medium mt-0.5">CURRENT</div>
          )}
        </div>

        {/* Bills */}
        <div className="col-span-2 text-right">
          {cp.billTotal > 0 ? (
            <span className="text-xs font-medium text-[#EF5350]">{formatCurrency(cp.billTotal)}</span>
          ) : (
            <span className="text-xs text-[#4a6080]">—</span>
          )}
        </div>

        {/* Extra */}
        <div
          className="col-span-2 text-right"
          onClick={e => { e.stopPropagation(); onAddExtra() }}
        >
          {cp.extraTotal !== 0 ? (
            <span className="text-xs font-medium text-[#FFA726]">{formatCurrency(cp.extraTotal)}</span>
          ) : (
            <span className="text-xs text-[#4a6080] hover:text-[#FFA726]">+</span>
          )}
        </div>

        {/* Net */}
        <div className="col-span-2 text-right">
          <span className={`text-xs font-bold ${cp.net >= 0 ? 'text-[#FFD740]' : 'text-[#EF5350]'}`}>
            {formatCurrency(cp.net)}
          </span>
        </div>

        {/* Balance */}
        <div className="col-span-3 text-right flex items-center justify-end gap-1">
          <span className={`text-xs font-bold ${cp.runningBalance >= 0 ? 'text-[#4DD0E1]' : 'text-[#EF5350]'}`}>
            {formatCurrency(cp.runningBalance)}
          </span>
          <ChevronRight size={12} className="text-[#4a6080]" />
        </div>
      </div>
    </div>
  )
}
