import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, isSameMonth, isSameDay, isToday, addYears, subYears,
} from 'date-fns'
import { parseISODate, toISODate } from '../../lib/billEngine'
import { Modal } from './Modal'

interface CalendarPickerProps {
  value: string // ISO YYYY-MM-DD
  onChange: (isoDate: string) => void
  label?: string
  error?: string
  minDate?: Date
  maxDate?: Date
}

export function CalendarPicker({ value, onChange, label, error, minDate, maxDate }: CalendarPickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = value ? parseISODate(value) : new Date()
  const displayValue = value ? format(selectedDate, 'MM-dd-yyyy') : 'Select date'

  return (
    <>
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm text-[#90CAF9] font-medium">{label}</label>}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`
            w-full flex items-center justify-between
            bg-[#0D2137] border rounded-xl px-4 py-3 min-h-[44px]
            text-base transition-colors text-left
            ${error ? 'border-[#EF5350]' : 'border-[#1F4068] hover:border-[#64B5F6]'}
          `}
        >
          <span className={value ? 'text-[#E0E0E0]' : 'text-[#4a6080]'}>{displayValue}</span>
          <Calendar size={18} className="text-[#64B5F6]" />
        </button>
        {error && <p className="text-xs text-[#EF5350]">{error}</p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Select Date">
        <CalendarGrid
          selected={selectedDate}
          onSelect={date => {
            onChange(toISODate(date))
            setOpen(false)
          }}
          minDate={minDate}
          maxDate={maxDate}
        />
      </Modal>
    </>
  )
}

interface CalendarGridProps {
  selected: Date
  onSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
}

function CalendarGrid({ selected, onSelect, minDate, maxDate }: CalendarGridProps) {
  const [viewDate, setViewDate] = useState(selected)
  const [yearMode, setYearMode] = useState(false)

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  let cursor = calStart
  while (cursor <= calEnd) {
    days.push(new Date(cursor))
    cursor = new Date(cursor.getTime() + 86400000)
  }

  if (yearMode) {
    const currentYear = viewDate.getFullYear()
    const years = Array.from({ length: 20 }, (_, i) => currentYear - 5 + i)
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setViewDate(subYears(viewDate, 10))} className="p-2 rounded-lg hover:bg-[#1F4068]">
            <ChevronLeft size={18} className="text-[#64B5F6]" />
          </button>
          <span className="text-[#E0E0E0] font-medium">{currentYear - 5} – {currentYear + 14}</span>
          <button onClick={() => setViewDate(addYears(viewDate, 10))} className="p-2 rounded-lg hover:bg-[#1F4068]">
            <ChevronRight size={18} className="text-[#64B5F6]" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {years.map(yr => (
            <button
              key={yr}
              onClick={() => {
                setViewDate(new Date(yr, viewDate.getMonth(), 1))
                setYearMode(false)
              }}
              className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                yr === currentYear
                  ? 'bg-[#64B5F6] text-[#1B1B2F]'
                  : 'text-[#E0E0E0] hover:bg-[#1F4068]'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-6">
      {/* Month/Year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="p-2 rounded-lg hover:bg-[#1F4068] transition-colors"
        >
          <ChevronLeft size={18} className="text-[#64B5F6]" />
        </button>
        <button
          onClick={() => setYearMode(true)}
          className="text-[#E0E0E0] font-semibold text-base hover:text-[#64B5F6] transition-colors"
        >
          {format(viewDate, 'MMMM yyyy')}
        </button>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="p-2 rounded-lg hover:bg-[#1F4068] transition-colors"
        >
          <ChevronRight size={18} className="text-[#64B5F6]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-xs text-[#90CAF9] font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => {
          const isSelected = isSameDay(day, selected)
          const isCurrentMonth = isSameMonth(day, viewDate)
          const isCurrentDay = isToday(day)
          const isDisabled =
            (minDate && day < minDate) ||
            (maxDate && day > maxDate)

          return (
            <button
              key={i}
              onClick={() => !isDisabled && onSelect(day)}
              disabled={isDisabled}
              className={`
                mx-auto w-9 h-9 flex items-center justify-center rounded-full text-sm
                transition-colors font-medium
                ${isSelected ? 'bg-[#64B5F6] text-[#1B1B2F]' : ''}
                ${!isSelected && isCurrentDay ? 'border border-[#64B5F6] text-[#64B5F6]' : ''}
                ${!isSelected && !isCurrentDay && isCurrentMonth ? 'text-[#E0E0E0] hover:bg-[#1F4068]' : ''}
                ${!isCurrentMonth ? 'text-[#4a6080]' : ''}
                ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>

      {/* Today button */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            const today = new Date()
            setViewDate(today)
            onSelect(today)
          }}
          className="text-sm text-[#64B5F6] font-medium hover:underline"
        >
          Today
        </button>
      </div>
    </div>
  )
}
