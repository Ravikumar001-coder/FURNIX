import { useState, useEffect, useCallback } from 'react'
import { orderService } from '../services/orderService'

/**
 * Custom hook for order data management.
 */
export const useOrders = (initialStatus = null) => {
  const [orders,  setOrders]  = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [status,  setStatus]  = useState(initialStatus)

  const fetchOrders = useCallback(async (s = status) => {
    setLoading(true)
    setError(null)
    try {
      const [ordersData, statsData] = await Promise.all([
        orderService.getAll(s),
        orderService.getStats(),
      ])
      setOrders(ordersData)
      setStats(statsData)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetchOrders() }, [status])

  const updateStatus = async (id, newStatus, notes) => {
    const updated = await orderService.updateStatus(id, newStatus, notes)
    setOrders(prev => prev.map(o => o.id === id ? updated : o))
    return updated
  }

  const deleteOrder = async (id) => {
    await orderService.delete(id)
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  return {
    orders,
    stats,
    loading,
    error,
    status,
    setStatus,
    updateStatus,
    deleteOrder,
    refetch: fetchOrders,
  }
}