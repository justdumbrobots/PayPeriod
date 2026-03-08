import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'

export function Toast() {
  const { toast, clearToast } = useUIStore()
  if (!toast) return null

  const icons = {
    success: <CheckCircle size={18} className="text-[#66BB6A]" />,
    error:   <AlertCircle size={18} className="text-[#EF5350]" />,
    info:    <Info size={18} className="text-[#64B5F6]" />,
  }

  const borders = {
    success: 'border-[#66BB6A]/30',
    error:   'border-[#EF5350]/30',
    info:    'border-[#64B5F6]/30',
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 pointer-events-none">
      <div
        className={`flex items-center gap-3 bg-[#162447] border ${borders[toast.type]} rounded-2xl px-4 py-3 shadow-2xl fade-in pointer-events-auto`}
        onClick={clearToast}
      >
        {icons[toast.type]}
        <span className="text-sm text-[#E0E0E0] font-medium">{toast.message}</span>
      </div>
    </div>
  )
}
