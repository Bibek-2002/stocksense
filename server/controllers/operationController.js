const mongoose = require('mongoose');
const Operation = require('../models/Operation');
const StockMove = require('../models/StockMove');
const StockQuant = require('../models/StockQuant');

async function upsertQuant(product_id, location_id, delta, session) {
  await StockQuant.findOneAndUpdate(
    { product_id, location_id },
    { $inc: { quantity: delta } },
    { upsert: true, new: true, session }
  );
}

exports.createOperation = async (req, res) => {
  try {
    const { type, partner_name, source_location_id, dest_location_id, lines, notes } = req.body;

    if (!lines || lines.length === 0) {
      return res.status(400).json({ error: 'At least one product line is required' });
    }

    const operation = await Operation.create({
      type,
      partner_name,
      source_location_id: source_location_id || null,
      dest_location_id: dest_location_id || null,
      lines,
      notes,
      created_by: req.user._id,
      status: 'draft'
    });

    res.status(201).json(operation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOperations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const operations = await Operation.find(filter)
      .populate('source_location_id', 'name')
      .populate('dest_location_id', 'name')
      .populate('lines.product_id', 'name sku')
      .sort({ createdAt: -1 });

    res.json(operations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOperationById = async (req, res) => {
  try {
    const operation = await Operation.findById(req.params.id)
      .populate('source_location_id', 'name')
      .populate('dest_location_id', 'name')
      .populate('lines.product_id', 'name sku');

    if (!operation) return res.status(404).json({ error: 'Operation not found' });
    res.json(operation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOperation = async (req, res) => {
  try {
    const operation = await Operation.findById(req.params.id);
    if (!operation) return res.status(404).json({ error: 'Operation not found' });
    if (operation.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft operations can be edited' });
    }

    const editableFields = ['type', 'partner_name', 'source_location_id', 'dest_location_id', 'lines', 'notes'];
    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        operation[field] = req.body[field];
      }
    }
    await operation.save();
    res.json(operation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.validateOperation = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const op = await Operation.findById(req.params.id).session(session);
    if (!op) throw new Error('Operation not found');
    if (op.status === 'done') throw new Error('Operation already validated');
    if (op.status === 'canceled') throw new Error('Cannot validate a canceled operation');
    if (!op.lines || op.lines.length === 0) throw new Error('Operation has no lines to validate');

    for (const line of op.lines) {
      const { product_id, quantity } = line;

      if (op.type === 'adjustment') {
        const locationId = op.source_location_id || op.dest_location_id;
        if (!locationId) throw new Error('Adjustment requires a location');
        await upsertQuant(product_id, locationId, quantity, session);

        await StockMove.create([{
          product_id,
          from_location_id: quantity < 0 ? locationId : null,
          to_location_id: quantity >= 0 ? locationId : null,
          quantity: Math.abs(quantity),
          operation_id: op._id,
          move_type: 'adjustment',
          reference: op.notes || 'Stock adjustment',
          created_by: op.created_by
        }], { session });
      } else {
        if (op.source_location_id) {
          await upsertQuant(product_id, op.source_location_id, -quantity, session);
        }
        if (op.dest_location_id) {
          await upsertQuant(product_id, op.dest_location_id, quantity, session);
        }

        await StockMove.create([{
          product_id,
          from_location_id: op.source_location_id || null,
          to_location_id: op.dest_location_id || null,
          quantity,
          operation_id: op._id,
          move_type: op.type,
          reference: op.partner_name || op.notes,
          created_by: op.created_by
        }], { session });
      }
    }

    op.status = 'done';
    op.validated_at = new Date();
    await op.save({ session });

    await session.commitTransaction();

    const populated = await Operation.findById(op._id)
      .populate('source_location_id', 'name')
      .populate('dest_location_id', 'name')
      .populate('lines.product_id', 'name sku');

    res.json({ success: true, operation: populated });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
};

exports.cancelOperation = async (req, res) => {
  try {
    const op = await Operation.findById(req.params.id);
    if (!op) return res.status(404).json({ error: 'Operation not found' });
    if (op.status === 'done') return res.status(400).json({ error: 'Cannot cancel a validated operation' });

    op.status = 'canceled';
    await op.save();
    res.json(op);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
