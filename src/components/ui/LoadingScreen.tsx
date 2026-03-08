interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-[#1B1B2F] flex flex-col items-center justify-center gap-4 z-50">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#1F4068]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#64B5F6] animate-spin" />
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-[#64B5F6] mb-1">PayPeriod</div>
        <div className="text-sm text-[#90CAF9]">{message}</div>
      </div>
    </div>
  )
}
