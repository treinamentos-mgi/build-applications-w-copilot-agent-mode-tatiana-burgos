import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  fixtureKey: { type: String, trim: true, select: false, unique: true, sparse: true },
  name: { type: String, required: [true, 'Nome é obrigatório'], trim: true, minlength: 1 },
  email: {
    type: String,
    required: [true, 'E-mail é obrigatório'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'E-mail inválido'],
    unique: true,
  },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  fitnessGoal: { type: String, required: [true, 'Meta de condicionamento é obrigatória'], trim: true, minlength: 1 },
});

export const User = model('User', userSchema);
