const Item = require('../models/Item');
const User = require('../models/User');

// Create a new item
exports.createItem = async (req, res) => {
  try {
    const itemData = req.body;

    // If createBy is not provided, set it to req.user.id
    if (!itemData.createBy) {
      itemData.createBy = req.user.id;
    }

    const item = new Item(itemData);
    await item.save();

    // If parentId is provided, add this item's reference to the parent collection's childCollections
    if (itemData.parentId) {
      const parentCollection = await Collection.findById(itemData.parentId);
      if (parentCollection) {
        parentCollection.childCollections.push({ id: item._id, type: 'Item' });
        await parentCollection.save();
      }
    }else {
      // If parentId is null, add this item to the user's mainCollection
      const user = await User.findById(req.user.id);
      user.mainCollection.push({ id: item._id, type: 'Item' });
      await user.save();
    }

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get an item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an item
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
