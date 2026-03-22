import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getProviderApis, deleteProviderApi, updateProviderApi, createProviderApi, getSubscriberInsights } from '../api/api';

const ProviderApiContext = createContext();

export function ProviderApiProvider({ children }) {
  const [apis, setApis] = useState([]);

  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Fetch subscribers for provider (default providerId = 9)
  const fetchSubscribers = useCallback(async (providerId = '9') => {
    try {
      const data = await getSubscriberInsights(providerId);
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (err) {
      setSubscribers([]);
    }
  }, []);

  // Always merge mock state from localStorage after fetch, and include mocked APIs even if not in backend
  const fetchApis = useCallback(async (userId = '9') => {
    setLoading(true);
    try {
      const data = await getProviderApis(userId);
      let apis = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const mocks = JSON.parse(localStorage.getItem('mockedApis') || '{}');
      // Map backend APIs and mark mocked
      let apiMap = {};
      apis = apis.map(api => {
        apiMap[api.id] = true;
        return mocks[api.id]
          ? { ...api, mocked: true, mockData: mocks[api.id].mockData, replaceOriginal: mocks[api.id].replaceOriginal }
          : { ...api, mocked: false, mockData: undefined, replaceOriginal: false };
      });
      // Add any mocked APIs not present in backend response
      Object.keys(mocks).forEach(id => {
        if (!apiMap[id]) {
          apis.push({
            id,
            name: mocks[id].mockData?.name || `Mocked API ${id}`,
            mocked: true,
            mockData: mocks[id].mockData,
            replaceOriginal: mocks[id].replaceOriginal,
            description: mocks[id].mockData?.description || '',
            active: true
          });
        }
      });
      setApis(apis);
      setError('');
    } catch (err) {
      // If backend fails, still show mocked APIs
      const mocks = JSON.parse(localStorage.getItem('mockedApis') || '{}');
      const apis = Object.keys(mocks).map(id => ({
        id,
        name: mocks[id].mockData?.name || `Mocked API ${id}`,
        mocked: true,
        mockData: mocks[id].mockData,
        replaceOriginal: mocks[id].replaceOriginal,
        description: mocks[id].mockData?.description || '',
        active: true
      }));
      setApis(apis);
      setError(err?.message || 'Failed to load APIs.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete API
  const deleteApi = async (apiId) => {
    try {
      await deleteProviderApi(apiId);
      setApis((prev) => prev.filter((api) => api.id !== apiId));
    } catch (err) {
      setError(err?.message || 'Failed to delete API.');
    }
  };

  // Mock API (with replace support)
  const mockApi = (apiId, mockData, replaceOriginal = false) => {
    const mocks = JSON.parse(localStorage.getItem('mockedApis') || '{}');
    if (mockData === '' && !replaceOriginal) {
      // Disable mock
      delete mocks[apiId];
    } else {
      mocks[apiId] = { mockData, replaceOriginal };
    }
    localStorage.setItem('mockedApis', JSON.stringify(mocks));
    fetchApis();
  };

  // Update API (stub)
  const updateApi = async (apiId, payload) => {
    try {
      await updateProviderApi(apiId, payload);
      fetchApis();
    } catch (err) {
      setError(err?.message || 'Failed to update API.');
    }
  };

  // Create API (stub)
  const createApi = async (payload) => {
    try {
      await createProviderApi(payload);
      fetchApis();
    } catch (err) {
      setError(err?.message || 'Failed to create API.');
    }
  };

  return (
    <ProviderApiContext.Provider value={{ apis, setApis, fetchApis, loading, error, deleteApi, mockApi, updateApi, createApi, subscribers, fetchSubscribers }}>
      {children}
    </ProviderApiContext.Provider>
  );
}

export function useProviderApis() {
  return useContext(ProviderApiContext);
}
