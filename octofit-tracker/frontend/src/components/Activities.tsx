import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

const activityLabels: Record<string, string> = {
  run: 'Corrida',
  cycle: 'Ciclismo',
  strength: 'Treino de força',
  walk: 'Caminhada',
  swim: 'Natação',
};

export default function Activities() {
  const state = useApiResource<Activity>('/api/activities', 'activities');
  return (
    <CapabilityCard title="Atividades" description="Acompanhe os minutos de atividade e os pontos das pessoas participantes." emptyMessage="Nenhuma atividade registrada." state={state}>
      {(activities) => <ul>{activities.map((activity, index) => <li key={activity._id ?? `${activity.type}-${index}`}>
        {activityLabels[activity.type] ?? activity.type}: {activity.minutes} min, {activity.points} pontos
      </li>)}</ul>}
    </CapabilityCard>
  );
}
