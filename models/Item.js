const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String },
  image : { type: String, required: true },
  parentId: { type: String },
  createBy: { type: String },
  createAt: { type: Date, default: Date.now },
  modifiedBy: { type: String },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Item', itemSchema);
