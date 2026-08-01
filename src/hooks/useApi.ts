import { useState, useEffect, useCallback } from 'react';

export function useApi<T = any>(apiCall: () => Promise<any>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiCall();
      // Unwraps response if wrapped in { success, data } or { data: { data } }
      const resData = res?.data?.data !== undefined ? res.data.data : (res?.data !== undefined ? res.data : res);
      setData(resData);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'An unexpected error occurred';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

export default useApi;
