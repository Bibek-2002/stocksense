const Location = require('../models/Location');

exports.createLocation = async (req, res) => {
  try {
    const { name, type, parent_id } = req.body;
    const location = await Location.create({ name, type, parent_id: parent_id || null });
    res.status(201).json(location);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find().populate('parent_id', 'name');
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json(location);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
