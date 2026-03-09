import {
  useCallback,
  useEffect,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from "react";

export type AsyncResource<T> = {
  data: T | null;
  setData: Dispatch<SetStateAction<T | null>>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useAsyncResource<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
  enabled = true,
): AsyncResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [enabled, loader]);

  useEffect(() => {
    refresh();
  }, [refresh, ...deps]);

  return { data, setData, loading, error, refresh };
}
