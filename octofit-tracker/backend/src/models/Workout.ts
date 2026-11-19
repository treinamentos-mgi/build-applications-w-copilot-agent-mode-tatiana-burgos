import { Schema, model } from 'mongoose';

const workoutSchema = new Schema({
  fixtureKey: { type: String, trim: true, select: false, unique: true, sparse: true },
  title: { type: String, required: [true, 'Título é obrigatório'], trim: true, minlength: 1 },
  focus: { type: String, required: [true, 'Foco é obrigatório'], trim: true, minlength: 1 },
  minutes: { type: Number, required: [true, 'Duração é obrigatória'], min: [1, 'O treino deve durar pelo menos um minuto'] },
  difficulty: { type: String, required: [true, 'Dificuldade é obrigatória'], trim: true, minlength: 1 },
});

export const Workout = model('Workout', workoutSchema);
