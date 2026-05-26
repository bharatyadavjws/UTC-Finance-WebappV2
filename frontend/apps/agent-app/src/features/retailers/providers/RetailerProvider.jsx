import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { retailerRepository } from '../services/retailerRepository'

const RetailerContext = createContext(null)

export function RetailerProvider({ children }) {
  const [retailers, setRetailers] = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const fetchRetailers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await retailerRepository.list()
      setRetailers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to fetch retailers')
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(() => ({
    retailers,
    loading,
    error,
    fetchRetailers,
  }), [retailers, loading, error, fetchRetailers])

  return (
    <RetailerContext.Provider value={value}>
      {children}
    </RetailerContext.Provider>
  )
}

export function useRetailers() {
  const context = useContext(RetailerContext)
  if (!context) throw new Error('useRetailers must be used inside RetailerProvider')
  return context
}
