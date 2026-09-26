const mongoose = require('mongoose');

const stockQuantSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  quantity: { type: Number, required: true, default: 0 }
});

stockQuantSchema.index({ product_id: 1, location_id: 1 }, { unique: true });

module.exports = mongoose.model('StockQuant', stockQuantSchema);
