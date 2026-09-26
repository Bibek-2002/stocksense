const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

const operationSchema = new mongoose.Schema({
  type: { type: String, enum: ['receipt', 'delivery', 'internal', 'adjustment'], required: true },
  status: { type: String, enum: ['draft', 'waiting', 'ready', 'done', 'canceled'], default: 'draft' },
  partner_name: String,
  source_location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  dest_location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  lines: [lineSchema],
  notes: String,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validated_at: Date
}, { timestamps: true });

module.exports = mongoose.model('Operation', operationSchema);
