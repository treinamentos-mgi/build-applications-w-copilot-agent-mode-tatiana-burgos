import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: [true, 'Nome é obrigatório'] },
  email: { type: String, required: [true, 'E-mail é obrigatório'], unique: true },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  fitnessGoal: { type: String, required: [true, 'Meta de condicionamento é obrigatória'] },
});

export const User = model('User', userSchema);
