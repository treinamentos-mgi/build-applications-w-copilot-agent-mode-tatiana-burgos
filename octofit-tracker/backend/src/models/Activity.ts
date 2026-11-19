import { Schema, model } from 'mongoose';

const activitySchema = new Schema({
  fixtureKey: { type: String, trim: true, select: false, unique: true, sparse: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Pessoa é obrigatória'] },
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: [true, 'Equipe é obrigatória'] },
  type: { type: String, required: [true, 'Tipo é obrigatório'], trim: true, minlength: 1 },
  minutes: { type: Number, required: [true, 'Minutos são obrigatórios'], min: [1, 'A atividade deve durar pelo menos um minuto'] },
  points: { type: Number, required: [true, 'Pontos são obrigatórios'], min: [0, 'Os pontos não podem ser negativos'] },
  occurredAt: { type: Date, required: [true, 'Data é obrigatória'] },
});

export const Activity = model('Activity', activitySchema);
