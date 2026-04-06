import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { retailerService } from '../../../services/retailerService';

const RetailerContext = createContext(null);

export function RetailerProvider({ children }) {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchRetailers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await retailerService.getRetailers();
      setRetailers(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch retailers');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRetailer = useCallback(async (payload) => {
    try {
      setSubmitting(true);
      setError('');
      const response = await retailerService.createRetailer(payload);
      const createdRetailer = response.data;

      setRetailers((prev) => [createdRetailer, ...prev]);
      return createdRetailer;
    } catch (err) {
      setError(err.message || 'Failed to create retailer');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateRetailer = useCallback(async (retailerCode, payload) => {
    try {
      setSubmitting(true);
      setError('');
      const response = await retailerService.updateRetailer(retailerCode, payload);
      const updatedRetailer = response.data;

      setRetailers((prev) =>
        prev.map((item) => (item.id === retailerCode ? updatedRetailer : item))
      );

      return updatedRetailer;
    } catch (err) {
      setError(err.message || 'Failed to update retailer');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateRetailerStatus = useCallback(async (retailerCode, status) => {
    try {
      setSubmitting(true);
      setError('');
      const response = await retailerService.updateRetailerStatus(retailerCode, status);
      const updatedRetailer = response.data;

      setRetailers((prev) =>
        prev.map((item) => (item.id === retailerCode ? updatedRetailer : item))
      );

      return updatedRetailer;
    } catch (err) {
      setError(err.message || 'Failed to update retailer status');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      retailers,
      loading,
      submitting,
      error,
      fetchRetailers,
      createRetailer,
      updateRetailer,
      updateRetailerStatus,
    }),
    [
      retailers,
      loading,
      submitting,
      error,
      fetchRetailers,
      createRetailer,
      updateRetailer,
      updateRetailerStatus,
    ]
  );

  return <RetailerContext.Provider value={value}>{children}</RetailerContext.Provider>;
}

export function useRetailers() {
  const context = useContext(RetailerContext);

  if (!context) {
    throw new Error('useRetailers must be used inside RetailerProvider');
  }

  return context;
}