import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

// Insere registros de demonstração estáveis sem apagar dados da aplicação.
async function upsertDemoUser(fixtureKey: string, name: string, email: string, teamId: InstanceType<typeof Team>['_id'], fitnessGoal: string) {
  const fixtureFilter = { $or: [{ fixtureKey }, { email }] };
  const previousUser = await User.findOne(fixtureFilter).select('_id team');
  if (previousUser?.team && previousUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: previousUser.team }, { $pull: { members: previousUser._id } });
  }
  const user = await User.findOneAndUpdate(
    fixtureFilter,
    { $set: { fixtureKey, name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });
  return user;
}

async function upsertDemoTeam(fixtureKey: string, name: string, mascot: string) {
  return Team.findOneAndUpdate(
    { $or: [{ fixtureKey }, { name, mascot }] },
    { $set: { fixtureKey, name, mascot } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
}

async function upsertDemoWorkout(fixtureKey: string, title: string, focus: string, minutes: number, difficulty: string) {
  return Workout.findOneAndUpdate(
    { $or: [{ fixtureKey }, { title, focus }] },
    { $set: { fixtureKey, title, focus, minutes, difficulty } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
}

export async function seed() {
  await connectDatabase();
  try {
    const octocats = await upsertDemoTeam('demo:team:octocats', 'Octocats', 'Mona');
    const robocats = await upsertDemoTeam('demo:team:robocats', 'Robocats', 'Hubot');
    const codecats = await upsertDemoTeam('demo:team:codecats', 'Codecats', 'Copilot');
    await upsertDemoTeam('demo:team:pandacats', 'Pandacats', 'Panda');
    const mona = await upsertDemoUser('demo:user:mona', 'Mona', 'mona@example.com', octocats._id, 'endurance');
    const hubot = await upsertDemoUser('demo:user:hubot', 'Hubot', 'hubot@example.com', robocats._id, 'strength');
    const copilot = await upsertDemoUser('demo:user:copilot', 'Copilot', 'copilot@example.com', codecats._id, 'mobility');

    const monaRunAt = new Date('2026-01-10T12:00:00.000Z');
    const hubotCycleAt = new Date('2026-01-11T12:00:00.000Z');
    const copilotStrengthAt = new Date('2026-01-12T12:00:00.000Z');
    await Activity.updateOne(
      { $or: [{ fixtureKey: 'demo:activity:mona:run:2026-01-10' }, { user: mona._id, team: octocats._id, type: 'run', occurredAt: monaRunAt }] },
      { $set: { fixtureKey: 'demo:activity:mona:run:2026-01-10', user: mona._id, team: octocats._id, type: 'run', minutes: 40, points: 40, occurredAt: monaRunAt } },
      { upsert: true, runValidators: true },
    );
    await Activity.updateOne(
      { $or: [{ fixtureKey: 'demo:activity:hubot:cycle:2026-01-11' }, { user: hubot._id, team: robocats._id, type: 'cycle', occurredAt: hubotCycleAt }] },
      { $set: { fixtureKey: 'demo:activity:hubot:cycle:2026-01-11', user: hubot._id, team: robocats._id, type: 'cycle', minutes: 25, points: 25, occurredAt: hubotCycleAt } },
      { upsert: true, runValidators: true },
    );
    await Activity.updateOne(
      { $or: [{ fixtureKey: 'demo:activity:copilot:strength:2026-01-12' }, { user: copilot._id, team: codecats._id, type: 'strength', occurredAt: copilotStrengthAt }] },
      { $set: { fixtureKey: 'demo:activity:copilot:strength:2026-01-12', user: copilot._id, team: codecats._id, type: 'strength', minutes: 20, points: 20, occurredAt: copilotStrengthAt } },
      { upsert: true, runValidators: true },
    );
    await upsertDemoWorkout('demo:workout:intervalos', 'Intervalos', 'endurance', 30, 'moderate');
    await upsertDemoWorkout('demo:workout:circuito-de-forca', 'Circuito de força', 'strength', 30, 'moderate');
    await upsertDemoWorkout('demo:workout:mobilidade-e-alongamento', 'Mobilidade e alongamento', 'mobility', 20, 'easy');
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
