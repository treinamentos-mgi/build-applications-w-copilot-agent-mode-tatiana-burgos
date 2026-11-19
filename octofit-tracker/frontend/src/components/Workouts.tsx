import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Suggestion = { _id?: string; title: string; reason?: string };

export default function Workouts() {
  const path = `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`;
  const state = useApiResource<Suggestion>(path, 'suggestions');
  return (
    <CapabilityCard title="Sugestões de treino" description="Receba recomendações de treino com base nos seus padrões de atividade." emptyMessage="Nenhuma sugestão de treino disponível." state={state}>
      {(suggestions) => <ul>{suggestions.map((suggestion, index) => <li key={suggestion._id ?? `${suggestion.title}-${index}`}>
        <strong>{suggestion.title}</strong>{suggestion.reason && <p>{suggestion.reason}</p>}
      </li>)}</ul>}
    </CapabilityCard>
  );
}
