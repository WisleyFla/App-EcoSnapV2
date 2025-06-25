// src/hooks/useLocation.js
import { useState } from 'react';
import { postsService } from '../services/postsService';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const locationData = await postsService.getCompleteLocation();
      setLocation(locationData);
      return locationData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setError(null);
  };

  const resetError = () => {
    setError(null);
  };

  return {
    location,
    loading,
    error,
    getLocation,
    clearLocation,
    resetError,
    hasLocation: !!location
  };
};