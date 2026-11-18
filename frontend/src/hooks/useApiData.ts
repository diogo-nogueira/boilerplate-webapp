import { useEffect, useState } from "react";

import { ApiError, apiGet } from "../api/client";

type FetchResult<T> = { path: string; data: T | null; error: string | null };

export type ApiData<T> = { data: T | null; error: string | null; loading: boolean };

// Vai buscar `path` sempre que muda. Uma resposta que chegue depois de o
// endereço ter mudado outra vez é ignorada. Enquanto chegam novos dados, os
// anteriores continuam disponíveis; mudar reloadKey volta a pedir os mesmos dados; num erro não fica nada por baixo da mensagem.
export function useApiData<T>(
  path: string,
  fallbackError: string,
  reloadKey = 0,
): ApiData<T> {
  const [result, setResult] = useState<FetchResult<T> | null>(null);

  useEffect(() => {
    let stale = false;
    apiGet<T>(path)
      .then((data) => {
        if (!stale) {
          setResult({ path, data, error: null });
        }
      })
      .catch((caught) => {
        if (!stale) {
          const message = caught instanceof ApiError ? caught.detail : fallbackError;
          setResult({ path, data: null, error: message });
        }
      });
    return () => {
      stale = true;
    };
  }, [path, fallbackError, reloadKey]);

  const loading = result === null || result.path !== path;
  return {
    data: result?.data ?? null,
    error: loading ? null : (result?.error ?? null),
    loading,
  };
}
