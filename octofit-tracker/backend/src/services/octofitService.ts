import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type ServiceError = Error & { status: number };

function serviceError(message: string, status: number): ServiceError {
  return Object.assign(new Error(message), { status });
}

function inputObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw serviceError('Os dados enviados são inválidos', 400);
  }
  return input as Record<string, unknown>;
}

function objectId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
    throw serviceError(`${field} inválido`, 400);
  }
  return value;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw serviceError(`${field} é obrigatório`, 400);
  }
  return value.trim();
}

const focusLabels: Record<string, string> = {
  endurance: 'resistência',
  strength: 'força',
  flexibility: 'flexibilidade',
  weight_loss: 'perda de peso',
};

function focusForActivity(type: string): string | undefined {
  if (['run', 'cycle', 'walk', 'swim'].includes(type)) return 'endurance';
  if (['strength', 'weights'].includes(type)) return 'strength';
  return undefined;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const data = inputObject(input);
  const userId = objectId(data.userId, 'Pessoa');
  const teamId = objectId(data.teamId, 'Equipe');
  const type = text(data.type, 'Tipo de atividade');
  const minutes = data.minutes;

  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw serviceError('Os minutos devem ser um número positivo', 400);
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw serviceError('Pessoa ou equipe não encontrada', 404);
  if (user.team && !user.team.equals(team._id)) {
    throw serviceError('A pessoa não pertence à equipe informada', 409);
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const data = inputObject(input);
  const name = text(data.name, 'Nome da equipe');
  const mascot = text(data.mascot, 'Mascote');
  if (data.members !== undefined && !Array.isArray(data.members)) {
    throw serviceError('A lista de integrantes é inválida', 400);
  }

  const memberIds = [...new Set((data.members ?? []).map((member) => objectId(member, 'Integrante')))];
  const users = await User.find({ _id: { $in: memberIds } }).select('_id team').lean();
  if (users.length !== memberIds.length) throw serviceError('Uma ou mais pessoas não foram encontradas', 404);

  const memberships = memberIds.length
    ? await Team.find({ members: { $in: memberIds } }).select('_id members').lean()
    : [];
  const alreadyAssigned = users.some((user) => user.team)
    || memberships.some((team) => team.members.some((member) => memberIds.includes(member.toString())));
  if (alreadyAssigned) throw serviceError('Uma ou mais pessoas já pertencem a uma equipe', 409);

  const team = await Team.create({ name, mascot, members: memberIds });
  try {
    if (memberIds.length) {
      const result = await User.updateMany({ _id: { $in: memberIds }, team: null }, { $set: { team: team._id } });
      if (result.matchedCount !== memberIds.length) {
        throw serviceError('Não foi possível associar todas as pessoas à equipe', 409);
      }
    }
    return team;
  } catch (error) {
    await Promise.all([
      User.updateMany({ _id: { $in: memberIds }, team: team._id }, { $unset: { team: 1 } }),
      Team.deleteOne({ _id: team._id }),
    ]);
    throw error;
  }
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  let rank = 0;
  let previousPoints: number | undefined;

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => {
      if (team.totalPoints !== previousPoints) rank = index + 1;
      previousPoints = team.totalPoints;
      return { ...team, rank };
    });
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw serviceError('Pessoa não encontrada', 404);

  const workouts = await Workout.find().sort({ title: 1 }).lean();
  const goalMatches = workouts.filter((workout) => workout.focus === user.fitnessGoal);
  const activities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const fallbackFocuses = activities
    .map((activity) => focusForActivity(activity.type))
    .filter((focus): focus is string => Boolean(focus));
  const selectedFocuses = goalMatches.length
    ? [user.fitnessGoal]
    : [...new Set(fallbackFocuses)].filter((focus) => workouts.some((workout) => workout.focus === focus));

  return workouts
    .filter((workout) => selectedFocuses.includes(workout.focus))
    .map((workout) => {
      const focus = workout.focus;
      const activityType = activities.find((activity) => focusForActivity(activity.type) === focus)?.type;
      const activityLabel = activityType === 'run' ? 'corrida' : focusLabels[focus] ?? 'atividade';
      const focusLabel = focusLabels[focus] ?? 'sua meta';
      return {
        ...workout,
        reason: activityType
          ? `Este treino apoia sua meta de ${focusLabel} e considera seu histórico de ${activityLabel}.`
          : `Este treino está alinhado à sua meta de ${focusLabel}.`,
      };
    });
}

export { User };
