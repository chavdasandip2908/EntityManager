const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  parentId: { type: String },
  image : { type: String, required: true },
  childCollections: [{
    id: { type: String },
    type: { type: String, required: true, enum: ['Collection', 'Item'] }
  }],
  createBy: { type: String },
  createAt: { type: Date, default: Date.now },
  modifiedBy: { type: String },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Collection', collectionSchema);
