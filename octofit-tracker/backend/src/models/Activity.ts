import { Schema, model } from 'mongoose';

const activitySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Pessoa é obrigatória'] },
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: [true, 'Equipe é obrigatória'] },
  type: { type: String, required: [true, 'Tipo é obrigatório'] },
  minutes: { type: Number, required: [true, 'Minutos são obrigatórios'] },
  points: { type: Number, required: [true, 'Pontos são obrigatórios'] },
  occurredAt: { type: Date, required: [true, 'Data é obrigatória'] },
});

export const Activity = model('Activity', activitySchema);
