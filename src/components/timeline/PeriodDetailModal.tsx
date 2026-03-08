import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useBudgetStore } from '../../stores/budgetStore'
import { useUIStore } from '../../stores/uiStore'
import { formatCurrency } from '../../lib/format'
import { BILL_FREQUENCY_LABELS, CATEGORY_META } from '../../types'

interface Props {
  periodIndex: number
  onClose: () => void
}

export function PeriodDetailModal({ periodIndex, onClose }: Props) {
  const { computedPeriods, removeExtraItem } = useBudgetStore()
  const { setSelectedPeriod, openExtraModal, showToast } = useUIStore()

  const cp = computedPeriods[periodIndex]
  if (!cp) return null

  const hasPrev = periodIndex > 0
  const hasNext = periodIndex < computedPeriods.length - 1

  const handleDeleteExtra = async (id: string) => {
    await removeExtraItem(id)
    showToast('Item removed', 'success')
  }

  return (
    <Modal open onClose={onClose} fullScreen>
      <div className="flex flex-col h-full">
        {/* Navigation header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F4068] bg-[#162447]">
          <button
            onClick={() => hasPrev && setSelectedPeriod(periodIndex - 1)}
            disabled={!hasPrev}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#1F4068] disabled:opacity-30 text-[#64B5F6]"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="text-base font-semibold text-[#E0E0E0]">{cp.period.payDateStr}</div>
            <div className="text-xs text-[#90CAF9]">Period #{periodIndex + 1}</div>
          </div>
          <button
            onClick={() => hasNext && setSelectedPeriod(periodIndex + 1)}
            disabled={!hasNext}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#1F4068] disabled:opacity-30 text-[#64B5F6]"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Income" value={cp.income} color="#66BB6A" />
            <SummaryCard label="Bills Total" value={-cp.billTotal} color="#EF5350" />
            <SummaryCard label="Extras" value={-cp.extraTotal} color="#FFA726" />
            <SummaryCard label="Total Expenses" value={-(cp.billTotal + cp.extraTotal)} color="#EF5350" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Net" value={cp.net} color={cp.net >= 0 ? '#FFD740' : '#EF5350'} large />
            <SummaryCard label="Running Balance" value={cp.runningBalance} color={cp.runningBalance >= 0 ? '#4DD0E1' : '#EF5350'} large />
          </div>

          {/* Bills due */}
          {cp.billAssignments.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-[#90CAF9] uppercase tracking-wider mb-3">
                Bills Due ({cp.billAssignments.length})
              </h3>
              <div className="flex flex-col gap-2">
                {cp.billAssignments.map(({ bill, amount }) => (
                  <div key={bill.id} className="flex items-center justify-between bg-[#0D2137] rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-8 rounded-full flex-shrink-0"
                        style={{ background: CATEGORY_META[bill.category]?.color ?? '#90A4AE' }}
                      />
                      <div>
                        <div className="text-sm font-medium text-[#E0E0E0]">{bill.name}</div>
                        <div className="text-xs text-[#90CAF9]">{BILL_FREQUENCY_LABELS[bill.frequency]}</div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#EF5350]">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Extra items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#90CAF9] uppercase tracking-wider">
                One-Time Items
              </h3>
              <button
                onClick={() => openExtraModal(periodIndex)}
                className="flex items-center gap-1 text-xs text-[#FFA726] font-medium"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {cp.extraItems.length === 0 ? (
              <div className="text-sm text-[#4a6080] text-center py-4">
                No extra items for this period
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {cp.extraItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-[#0D2137] rounded-xl px-4 py-3">
                    <div>
                      <div className="text-sm text-[#E0E0E0]">{item.note || 'Extra item'}</div>
                      <div className="text-xs text-[#90CAF9]">
                        {item.amount > 0 ? 'Expense' : 'Credit'}
                        {item.category ? ` · ${CATEGORY_META[item.category]?.label}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${item.amount > 0 ? 'text-[#FFA726]' : 'text-[#66BB6A]'}`}>
                        {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteExtra(item.id)}
                        className="w-7 h-7 flex items-center justify-center text-[#EF5350] hover:bg-[#EF5350]/10 rounded-full"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Modal>
  )
}

function SummaryCard({ label, value, color, large }: { label: string; value: number; color: string; large?: boolean }) {
  return (
    <div className="bg-[#0D2137] rounded-xl px-4 py-3">
      <div className="text-xs text-[#90CAF9] mb-1">{label}</div>
      <div className={`${large ? 'text-xl' : 'text-base'} font-bold`} style={{ color }}>
        {formatCurrency(value)}
      </div>
    </div>
  )
}
