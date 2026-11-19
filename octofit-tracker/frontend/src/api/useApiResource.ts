import { useEffect, useState } from 'react';
import { getJson } from './client.js';

export type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: T[] };

export function useApiResource<T>(path: string, key: string): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });

    getJson<Record<string, unknown>>(path)
      .then((response) => {
        const items = response[key];
        if (!Array.isArray(items)) throw new Error('Formato de resposta inválido');
        if (active) setState({ status: 'success', items: items as T[] });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });

    return () => {
      active = false;
    };
  }, [key, path]);

  return state;
}