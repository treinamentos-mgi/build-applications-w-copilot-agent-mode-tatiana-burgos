import { describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { seed } from '../src/scripts/seed.js';
import { Activity, Team, User, Workout } from '../src/models/index.js';

describe('Contrato de dados do OctoFit', () => {
  it('exige identidade e metas significativas para as pessoas usuárias', async () => {
    const user = new User({});
    const error = user.validateSync();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.email).toBeDefined();
    expect(error?.errors.fitnessGoal).toBeDefined();

    const invalid = new User({ name: '  ', email: 'email inválido', fitnessGoal: ' ' });
    const invalidError = invalid.validateSync();
    expect(invalidError?.errors.name).toBeDefined();
    expect(invalidError?.errors.email).toBeDefined();
    expect(invalidError?.errors.fitnessGoal).toBeDefined();
    const normalized = new User({ name: ' Mona ', email: ' MONA@EXAMPLE.COM ', fitnessGoal: 'endurance' });
    expect(normalized.validateSync()).toBeUndefined();
    expect(normalized.name).toBe('Mona');
    expect(normalized.email).toBe('mona@example.com');
  });
  it('impede dois registros de pessoas usuárias com o mesmo e-mail', async () => {
    const mongo = await MongoMemoryServer.create();
    try {
      await mongoose.connect(mongo.getUri());
      await User.init();
      await User.create({ name: 'Mona', email: 'duplicado@example.com', fitnessGoal: 'endurance' });
      await expect(User.create({ name: 'Hubot', email: 'duplicado@example.com', fitnessGoal: 'strength' })).rejects.toMatchObject({ code: 11000 });
    } finally {
      await mongoose.disconnect();
      await mongo.stop();
    }
  }, 60_000);

  it('impede chaves de fixture duplicadas sem exigir chave em registros comuns', async () => {
    const mongo = await MongoMemoryServer.create();
    try {
      await mongoose.connect(mongo.getUri());
      await User.init();
      await User.create({ name: 'Mona', email: 'mona@example.com', fitnessGoal: 'endurance', fixtureKey: 'demo:user:mona' });
      await expect(User.create({ name: 'Outra pessoa', email: 'other@example.com', fitnessGoal: 'strength', fixtureKey: 'demo:user:mona' })).rejects.toMatchObject({ code: 11000 });
      await expect(User.create({ name: 'Pessoa comum', email: 'ordinary@example.com', fitnessGoal: 'mobility' })).resolves.toBeTruthy();
    } finally {
      await mongoose.disconnect();
      await mongo.stop();
    }
  }, 60_000);
  it('exige nome, mascote e lista de integrantes nas equipes', () => {
    const team = new Team({ name: 'Octocats', mascot: 'Mona', members: [] });
    expect(team.validateSync()).toBeUndefined();
    const defaulted = new Team({ name: 'Robocats', mascot: 'Hubot' });
    expect(Array.isArray(defaulted.members)).toBe(true);
    expect(defaulted.members).toHaveLength(0);
    const memberId = new mongoose.Types.ObjectId();
    const withMember = new Team({ name: 'Codecats', mascot: 'Copilot', members: [memberId.toString()] });
    expect(withMember.members.map((member) => member.toString())).toEqual([memberId.toString()]);
    const missing = new Team({}).validateSync();
    expect(missing?.errors.name).toBeDefined();
    expect(missing?.errors.mascot).toBeDefined();
    const invalid = new Team({ name: ' ', mascot: ' ' }).validateSync();
    expect(invalid?.errors.name).toBeDefined();
    expect(invalid?.errors.mascot).toBeDefined();
    const normalized = new Team({ name: ' Octocats ', mascot: ' Mona ' });
    expect(normalized.validateSync()).toBeUndefined();
    expect(normalized.name).toBe('Octocats');
    expect(normalized.mascot).toBe('Mona');
  });
  it('impede chaves de fixture duplicadas em equipes', async () => {
    const mongo = await MongoMemoryServer.create();
    try {
      await mongoose.connect(mongo.getUri());
      await Team.init();
      await Team.create({ name: 'Octocats', mascot: 'Mona', fixtureKey: 'demo:team:octocats' });
      await expect(Team.create({ name: 'Robocats', mascot: 'Hubot', fixtureKey: 'demo:team:octocats' })).rejects.toMatchObject({ code: 11000 });
    } finally {
      await mongoose.disconnect();
      await mongo.stop();
    }
  }, 60_000);
  it('exige que as atividades relacionem pessoas, equipes, tipos, minutos, pontos e datas', () => {
    const activity = new Activity({});
    const error = activity.validateSync();
    expect(error?.errors.type).toBeDefined();
    expect(error?.errors.user).toBeDefined();
    expect(error?.errors.team).toBeDefined();
    expect(error?.errors.minutes).toBeDefined();
    expect(error?.errors.points).toBeDefined();
    expect(error?.errors.occurredAt).toBeDefined();
    const invalid = new Activity({
      user: new mongoose.Types.ObjectId(),
      team: new mongoose.Types.ObjectId(),
      type: ' ',
      minutes: 0,
      points: -1,
      occurredAt: new Date(),
    }).validateSync();
    expect(invalid?.errors.type).toBeDefined();
    expect(invalid?.errors.minutes).toBeDefined();
    expect(invalid?.errors.points).toBeDefined();
  });
  it('define sugestões de treino com foco, duração e dificuldade', () => {
    const workout = new Workout({});
    const error = workout.validateSync();
    expect(error?.errors.title).toBeDefined();
    expect(error?.errors.focus).toBeDefined();
    expect(error?.errors.minutes).toBeDefined();
    expect(error?.errors.difficulty).toBeDefined();
    const invalid = new Workout({ title: ' ', focus: ' ', minutes: 0, difficulty: ' ' }).validateSync();
    expect(invalid?.errors.title).toBeDefined();
    expect(invalid?.errors.focus).toBeDefined();
    expect(invalid?.errors.minutes).toBeDefined();
    expect(invalid?.errors.difficulty).toBeDefined();
    const normalized = new Workout({ title: ' Intervalos ', focus: ' endurance ', minutes: 30, difficulty: ' moderate ' });
    expect(normalized.validateSync()).toBeUndefined();
    expect(normalized.title).toBe('Intervalos');
    expect(normalized.focus).toBe('endurance');
    expect(normalized.difficulty).toBe('moderate');
  });
  it('impede chaves de fixture duplicadas em atividades e treinos', async () => {
    const mongo = await MongoMemoryServer.create();
    try {
      await mongoose.connect(mongo.getUri());
      await Promise.all([Activity.init(), Workout.init()]);
      const team = await Team.create({ name: 'Octocats', mascot: 'Mona' });
      const user = await User.create({ name: 'Mona', email: 'mona@example.com', fitnessGoal: 'endurance' });
      const activity = {
        user: user._id,
        team: team._id,
        type: 'run',
        minutes: 30,
        points: 30,
        occurredAt: new Date('2026-01-10T12:00:00.000Z'),
        fixtureKey: 'demo:activity:mona:run:2026-01-10',
      };
      await Activity.create(activity);
      await expect(Activity.create({ ...activity, type: 'cycle' })).rejects.toMatchObject({ code: 11000 });
      await Workout.create({ title: 'Intervalos', focus: 'endurance', minutes: 30, difficulty: 'moderate', fixtureKey: 'demo:workout:intervalos' });
      await expect(Workout.create({ title: 'Outro', focus: 'strength', minutes: 20, difficulty: 'easy', fixtureKey: 'demo:workout:intervalos' })).rejects.toMatchObject({ code: 11000 });
    } finally {
      await mongoose.disconnect();
      await mongo.stop();
    }
  }, 60_000);

  it('insere dados representativos para as quatro capacidades de forma idempotente', async () => {
    const mongo = await MongoMemoryServer.create();
    const previousUri = process.env.MONGODB_URI;
    process.env.MONGODB_URI = mongo.getUri();
    try {
      await mongoose.connect(mongo.getUri());
      const sentinelTeam = await Team.create({ name: 'Equipe não relacionada', mascot: 'Keep', members: [] });
      const sentinelUser = await User.create({
        name: 'Pessoa não relacionada',
        email: 'unrelated@example.com',
        team: sentinelTeam._id,
        fitnessGoal: 'mobility',
      });
      await Team.updateOne({ _id: sentinelTeam._id }, { $addToSet: { members: sentinelUser._id } });
      const previousTeam = await Team.create({ name: 'Previous team', mascot: 'Mona', members: [] });
      const existingMona = await User.create({
        name: 'Mona',
        email: 'mona@example.com',
        team: previousTeam._id,
        fitnessGoal: 'endurance',
      });
      await Team.updateOne({ _id: previousTeam._id }, { $addToSet: { members: existingMona._id } });
      const sentinelActivity = await Activity.create({
        user: sentinelUser._id,
        team: sentinelTeam._id,
        type: 'walk',
        minutes: 10,
        points: 10,
        occurredAt: new Date('2026-01-01T12:00:00.000Z'),
      });
      const sentinelWorkout = await Workout.create({
        title: 'Treino não relacionado',
        focus: 'mobility',
        minutes: 15,
        difficulty: 'easy',
      });
      await mongoose.disconnect();

      const counts = async () => {
        await mongoose.connect(mongo.getUri());
        const result = {
          users: await User.countDocuments(),
          teams: await Team.countDocuments(),
          activities: await Activity.countDocuments(),
          workouts: await Workout.countDocuments(),
        };
        await mongoose.disconnect();
        return result;
      };
      await seed();
      const first = await counts();
      expect(first.users).toBeGreaterThanOrEqual(3);
      expect(first.teams).toBeGreaterThanOrEqual(4);
      expect(first.activities).toBeGreaterThanOrEqual(3);
      expect(first.workouts).toBeGreaterThanOrEqual(3);
      await mongoose.connect(mongo.getUri());
      const seededMona = await User.findOne({ email: 'mona@example.com' }).select('+fixtureKey');
      const seededTeam = await Team.findOne({ name: 'Octocats' }).select('+fixtureKey');
      const retainedPreviousTeam = await Team.findById(previousTeam._id);
      expect(seededMona).toBeTruthy();
      expect(seededTeam).toBeTruthy();
      expect(retainedPreviousTeam).toBeTruthy();
      if (!seededMona || !seededTeam || !seededMona.team || !retainedPreviousTeam) throw new Error('Seed did not create linked Octocats fixtures');
      expect(seededMona.team.toString()).toBe(seededTeam._id.toString());
      expect(seededMona.fixtureKey).toBe('demo:user:mona');
      expect(seededTeam.fixtureKey).toBe('demo:team:octocats');
      expect(seededTeam.members.map((member) => member.toString())).toContain(seededMona._id.toString());
      expect(retainedPreviousTeam.members.map((member) => member.toString())).not.toContain(seededMona._id.toString());
      expect(await Activity.exists({ user: seededMona._id, team: seededTeam._id, type: 'run' })).toBeTruthy();
      const seededActivity = await Activity.findOne({ user: seededMona._id, team: seededTeam._id, type: 'run' }).select('+fixtureKey');
      expect(seededActivity?.fixtureKey).toBe('demo:activity:mona:run:2026-01-10');
      const seededWorkout = await Workout.findOne({ title: 'Intervalos' }).select('+fixtureKey');
      expect(seededWorkout?.fixtureKey).toBe('demo:workout:intervalos');
      expect(await User.exists({ _id: sentinelUser._id })).toBeTruthy();
      expect(await Team.exists({ _id: sentinelTeam._id })).toBeTruthy();
      expect(await Activity.exists({ _id: sentinelActivity._id })).toBeTruthy();
      expect(await Workout.exists({ _id: sentinelWorkout._id })).toBeTruthy();
      await mongoose.disconnect();
      await seed();
      expect(await counts()).toEqual(first);
    } finally {
      if (previousUri === undefined) delete process.env.MONGODB_URI;
      else process.env.MONGODB_URI = previousUri;
      await mongoose.disconnect();
      await mongo.stop();
    }
  }, 60_000);
});
