import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Team = { _id?: string; name: string; members?: unknown[] };

export default function Teams() {
  const state = useApiResource<Team>('/api/teams', 'teams');
  return (
    <CapabilityCard title="Equipes" description="Gerencie equipes e integrantes." emptyMessage="Nenhuma equipe cadastrada." state={state}>
      {(teams) => <ul>{teams.map((team, index) => <li key={team._id ?? `${team.name}-${index}`}>
        {team.name} - {team.members?.length ?? 0} integrantes
      </li>)}</ul>}
    </CapabilityCard>
  );
}
