import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  fullScreen?: boolean
}

export function Modal({ open, onClose, title, children, fullScreen = false }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        className={`
          relative bg-[#162447] w-full max-w-lg
          ${fullScreen
            ? 'h-full rounded-none'
            : 'rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto'}
          slide-up z-10
        `}
      >
        {/* Handle bar */}
        {!fullScreen && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-[#4a6080] rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1F4068]">
            <h2 className="text-lg font-semibold text-[#E0E0E0]">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1F4068] text-[#90CAF9] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={fullScreen ? 'h-full overflow-y-auto' : ''}>
          {children}
        </div>
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  dangerous?: boolean
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, dangerous = false,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#162447] rounded-2xl p-6 w-full max-w-sm z-10 slide-up">
        <h3 className="text-lg font-semibold text-[#E0E0E0] mb-2">{title}</h3>
        <p className="text-sm text-[#90CAF9] mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-[#1F4068] text-[#E0E0E0] font-medium active:scale-95 transition-transform"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-medium active:scale-95 transition-transform ${
              dangerous
                ? 'bg-[#EF5350] text-white'
                : 'bg-[#64B5F6] text-[#1B1B2F]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
