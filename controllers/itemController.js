const Item = require('../models/Item');
const User = require('../models/User');
const Collection = require('../models/Collection');
const handleDuplicateKeyError = require('../config/common');

// Create a new item
exports.createItem = async (req, res) => {
  try {
    const itemData = req.body;

    // Assign the current user's ID to createBy if not provided
    itemData.createBy = itemData.createBy || req.user.id;

    // Create and save the new item
    const item = new Item(itemData);
    await item.save();

    // If parentId is provided, add this item's reference to the parent collection's childCollections
    if (itemData.parentId) {


      const parentCollection = await Collection.findById(itemData.parentId);
      if (!parentCollection) {
        return res.status(404).json({
          statusCode: 404,
          message: 'Parent collection not found. The item was created, but it was not associated with any collection.',
          data: item,
        });
      }
      parentCollection.childCollections.push({ id: item._id, type: 'Item' });
      await parentCollection.save();

    } else {
      // If parentId is not provided, add the item to the user's mainCollection
      const user = await User.findById(req.user.id);
      if (user) {
        user.mainCollection.push({ id: item._id, type: 'Item' });
        await user.save();
      } else {
        return res.status(404).json({
          statusCode: 404,
          message: 'User not found. The item was created, but it was not associated with any user.',
          data: item,
        });
      }
    }

    res.status(201).json({
      statusCode: 201,
      message: 'Item created successfully.',
      data: item,
    });

  } catch (error) {
    const { status, message } = handleDuplicateKeyError(error);
    res.status(status).json({
      statusCode: status,
      message,
      data: null,
    });
  }
};

// Get all items with specific fields
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({ parentId: null }).select('id name type description');

    res.json({
      statusCode: 200,
      message: 'Items fetched successfully.',
      data: items,
    });
  } catch (error) {
    const { status, message } = handleDuplicateKeyError(error);
    res.status(status).json({
      statusCode: status,
      message,
      data: null,
    });
  }
};

// Get an item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Item not found',
        data: null,
      });
    }
    res.json({
      statusCode: 200,
      message: 'Item retrieved successfully',
      data: item,
    });
  } catch (error) {
    const { status, message } = handleDuplicateKeyError(error);
    res.status(status).json({
      statusCode: status,
      message,
      data: null,
    });
  }
};

// Update an item
exports.updateItem = async (req, res) => {
  try {

    // Find and update the item
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Check if the item exists
    if (!item) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Item not found',
        data: null,
      });
    }

    // Respond with the updated item
    res.json({
      statusCode: 200,
      message: 'Item updated successfully',
      data: item,
    });

  } catch (error) {
    const { status, message } = handleDuplicateKeyError(error);
    res.status(status).json({
      statusCode: status,
      message,
      data: null,
    });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Item not found',
        data: null,
      });
    }

    // Check if the item has a parent
    if (item.parentId === null) {
      // Remove item from user's mainCollection
      const user = await User.findById(item.createBy);
      if (user) {
        user.mainCollection = user.mainCollection.filter(c => c.id.toString() !== req.params.id);
        await user.save();
      }
    } else {
      // Remove from parent collection's childCollections
      const parentCollection = await Collection.findById(item.parentId);
      if (parentCollection) {
        parentCollection.childCollections = parentCollection.childCollections.filter(c => c.id.toString() !== req.params.id);
        await parentCollection.save();
      }
    }

    // Now delete the item
    await item.deleteOne();

    res.json({
      statusCode: 200,
      message: 'Item deleted successfully',
      data: null,
    });

  } catch (error) {
    const { status, message } = handleDuplicateKeyError(error);
    res.status(status).json({
      statusCode: status,
      message,
      data: null,
    });
  }
};
