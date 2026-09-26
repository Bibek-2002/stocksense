const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  uom: { type: String, default: 'unit' },
  reorder_level: { type: Number, default: 0 },
  lead_time_days: { type: Number, default: 5 },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
