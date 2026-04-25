import { getStatusConfig } from '../../utils/helpers'

const StatusBadge = ({ status, showDot = true }) => {
  const config = getStatusConfig(status)

  return (
    <span className="status-badge" style={{ color: config.color }}>
      {showDot && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
        />
      )}
      {config.label}
    </span>
  )
}

export default StatusBadge