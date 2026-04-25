import { getStatusConfig } from '../../utils/helpers'

/**
 * Displays colored dot + status label.
 * Used in order tables and detail pages.
 */
const OrderStatusBadge = ({ status, size = 'sm' }) => {
  const config = getStatusConfig(status)

  const sizes = {
    sm:  'text-xs px-2 py-1',
    md:  'text-sm px-3 py-1.5',
    lg:  'text-base px-4 py-2',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-semibold
                  tracking-widest uppercase ${sizes[size]}`}
      style={{ color: config.color }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  )
}

export default OrderStatusBadge