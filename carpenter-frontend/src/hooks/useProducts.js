import { useState, useEffect, useCallback } from 'react'
import { productService } from '../services/productService'

/**
 * Custom hook for product data management.
 * Handles loading, errors, filtering, and search.
 */
export const useProducts = (initialCategory = null) => {
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [category,  setCategory]  = useState(initialCategory)

  const fetchProducts = useCallback(async (cat = category) => {
    setLoading(true)
    setError(null)
    try {
      const data = await productService.getAll(
        cat && cat !== 'ALL' ? cat : null
      )
      setProducts(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => { fetchProducts() }, [category])

  const search = async (keyword) => {
    if (!keyword.trim()) { fetchProducts(); return }
    setLoading(true)
    try {
      const data = await productService.search(keyword)
      setProducts(data)
    } catch (err) {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => fetchProducts()

  return {
    products,
    loading,
    error,
    category,
    setCategory,
    search,
    refetch,
  }
}