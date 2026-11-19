import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  name: { type: String, required: [true, 'Nome da equipe é obrigatório'] },
  mascot: { type: String, required: [true, 'Mascote é obrigatório'] },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

export const Team = model('Team', teamSchema);
