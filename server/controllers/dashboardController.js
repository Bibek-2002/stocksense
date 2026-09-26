const Product = require('../models/Product');
const StockQuant = require('../models/StockQuant');
const Operation = require('../models/Operation');
const StockMove = require('../models/StockMove');

exports.getKPIs = async (req, res) => {
  try {
    const [products, stockTotals, pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
      Product.find().select('reorder_level').lean(),
      StockQuant.aggregate([
        { $group: { _id: '$product_id', quantity: { $sum: '$quantity' } } }
      ]),
      Operation.countDocuments({ type: 'receipt', status: { $nin: ['done', 'canceled'] } }),
      Operation.countDocuments({ type: 'delivery', status: { $nin: ['done', 'canceled'] } }),
      Operation.countDocuments({ type: 'internal', status: { $nin: ['done', 'canceled'] } })
    ]);

    const quantityByProduct = new Map(stockTotals.map(item => [String(item._id), item.quantity]));
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of products) {
      const quantity = quantityByProduct.get(String(product._id)) || 0;
      if (quantity <= 0) {
        outOfStockCount += 1;
      } else if (quantity <= product.reorder_level) {
        lowStockCount += 1;
      }
    }

    res.json({
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReorderSuggestions = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [products, outboundTotals, stockTotals] = await Promise.all([
      Product.find().select('name sku reorder_level lead_time_days').lean(),
      StockMove.aggregate([
        { $match: { move_type: 'delivery', created_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$product_id', quantity: { $sum: '$quantity' } } }
      ]),
      StockQuant.aggregate([
        { $group: { _id: '$product_id', quantity: { $sum: '$quantity' } } }
      ])
    ]);

    const outboundByProduct = new Map(outboundTotals.map(item => [String(item._id), item.quantity]));
    const stockByProduct = new Map(stockTotals.map(item => [String(item._id), item.quantity]));
    const suggestions = [];

    for (const product of products) {
      const productId = String(product._id);
      const totalOut = outboundByProduct.get(productId) || 0;
      const avgDailySales = totalOut / 30;
      if (avgDailySales <= 0) continue;

      const currentStock = stockByProduct.get(productId) || 0;
      const daysOfCover = currentStock / avgDailySales;
      const safetyDays = 2;
      const suggestedOrder = Math.max(
        0,
        Math.round((product.lead_time_days + safetyDays) * avgDailySales - currentStock)
      );

      suggestions.push({
        product_id: product._id,
        name: product.name,
        sku: product.sku,
        avgDailySales: Math.round(avgDailySales * 10) / 10,
        currentStock,
        daysOfCover: Math.round(daysOfCover * 10) / 10,
        suggestedOrder,
        message: `Based on last 30 days you move ~${Math.round(avgDailySales)} units/day. At current stock, you have ~${Math.round(daysOfCover * 10) / 10} days of cover. Suggested reorder: ${suggestedOrder} units.`
      });
    }

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function parsePositiveInteger(value, fallback, maxValue = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maxValue) : fallback;
}

exports.getLedger = async (req, res) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, 100);

    const [moves, total] = await Promise.all([
      StockMove.find()
        .populate('product_id', 'name sku')
        .populate('from_location_id', 'name')
        .populate('to_location_id', 'name')
        .sort({ created_at: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      StockMove.countDocuments()
    ]);

    res.json({ moves, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
