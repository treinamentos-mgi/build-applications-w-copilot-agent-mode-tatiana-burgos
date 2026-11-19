import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  fixtureKey: { type: String, trim: true, select: false, unique: true, sparse: true },
  name: { type: String, required: [true, 'Nome da equipe é obrigatório'], trim: true, minlength: 1 },
  mascot: { type: String, required: [true, 'Mascote é obrigatório'], trim: true, minlength: 1 },
  members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
});

export const Team = model('Team', teamSchema);
