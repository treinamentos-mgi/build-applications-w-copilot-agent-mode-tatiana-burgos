import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Entry = { _id?: string; teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const state = useApiResource<Entry>('/api/leaderboard', 'leaderboard');
  return (
    <CapabilityCard title="Placar" description="Compare a pontuação total das equipes." emptyMessage="Sem pontuação no placar." state={state}>
      {(entries) => <ol>{entries.map((entry, index) => <li key={entry._id ?? `${entry.teamName}-${index}`}>
        {entry.teamName}: {entry.totalPoints} pontos
      </li>)}</ol>}
    </CapabilityCard>
  );
}
