const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['warehouse', 'rack', 'floor', 'vendor', 'customer'], default: 'warehouse' },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null }
});

module.exports = mongoose.model('Location', locationSchema);
