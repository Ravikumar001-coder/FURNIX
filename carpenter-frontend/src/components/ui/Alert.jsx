import { AlertCircle, CheckCircle, X } from 'lucide-react'

const Alert = ({ type = 'error', message, onClose }) => {
  const styles = {
    error:   'border-red-800/50 bg-red-950/30 text-red-400',
    success: 'border-green-800/50 bg-green-950/30 text-green-400',
  }
  const Icon = type === 'success' ? CheckCircle : AlertCircle

  if (!message) return null

  return (
    <div className={`flex items-start gap-3 border px-4 py-3 ${styles[type]}`}>
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <span className="font-sans text-xs flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 hover:opacity-70">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export default Alert