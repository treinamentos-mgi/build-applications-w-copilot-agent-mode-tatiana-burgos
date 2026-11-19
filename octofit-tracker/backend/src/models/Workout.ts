import { Schema, model } from 'mongoose';

const workoutSchema = new Schema({
  title: String,
  focus: { type: String, required: [true, 'Foco é obrigatório'] },
  minutes: { type: Number, required: [true, 'Duração é obrigatória'] },
  difficulty: { type: String, required: [true, 'Dificuldade é obrigatória'] },
});

export const Workout = model('Workout', workoutSchema);
