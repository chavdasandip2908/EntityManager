const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
<<<<<<< HEAD
=======
  image: { type: String, required: true },
>>>>>>> 767ce9f (finally commit)
  password: { type: String, required: true },
  createBy: { type: String },
  createAt: { type: Date, default: Date.now },
  modifiedBy: { type: String },
  modifiedAt: { type: Date, default: Date.now },
  mainCollection: [{
    id: { type: mongoose.Schema.Types.ObjectId, refPath: 'mainCollection.type' },
    type: { type: String, required: true, enum: ['Collection', 'Item'] }
  }]
});

module.exports = mongoose.model('User', userSchema);
