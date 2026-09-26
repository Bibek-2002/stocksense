const mongoose = require('mongoose');

const stockMoveSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  from_location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  to_location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  quantity: { type: Number, required: true },
  operation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
  move_type: { type: String, enum: ['receipt', 'delivery', 'internal', 'adjustment'], required: true },
  reference: String,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('StockMove', stockMoveSchema);
