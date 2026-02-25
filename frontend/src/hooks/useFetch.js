import { useState, useEffect, useMemo } from "react";
import apiClient from "../apiClient";

export function useFetch(path, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize params by value so that callers creating a new object literal on
  // every render (e.g. `{ table }`) don't trigger unnecessary refetches.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableParams = useMemo(() => params, [JSON.stringify(params)]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get(path, stableParams)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => (cancelled = true);
  }, [path, stableParams]);

  return { data, loading, error };
}
