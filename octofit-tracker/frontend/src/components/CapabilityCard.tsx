import type { ReactNode } from 'react';
import type { ResourceState } from '../api/useApiResource.js';

type Props<T> = {
  title: string;
  description: string;
  emptyMessage: string;
  state: ResourceState<T>;
  children: (items: T[]) => ReactNode;
};

export function CapabilityCard<T>({ title, description, emptyMessage, state, children }: Props<T>) {
  return (
    <section className="card h-100" aria-labelledby="capability-title">
      <div className="card-body">
        <h2 className="h4" id="capability-title">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Carregando...</p>}
        {state.status === 'error' && <p role="alert">Não foi possível carregar os dados. Tente novamente.</p>}
        {state.status === 'success' && state.items.length === 0 && <p role="status">{emptyMessage}</p>}
        {state.status === 'success' && state.items.length > 0 && children(state.items)}
      </div>
    </section>
  );
}
