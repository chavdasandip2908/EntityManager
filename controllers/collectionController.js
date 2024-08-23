const Collection = require('../models/Collection');
const User = require('../models/User');
const Item = require('../models/Item');
const handleDuplicateKeyError = require('../config/common');


// Create a new collection
exports.createCollection = async (req, res) => {
  try {
    const collectionData = req.body;

    // If createBy is not provided, set it to req.user.id
    if (!collectionData.createBy) {
      collectionData.createBy = req.user.id;
    }

    // Convert parentId "0" to null
    if (collectionData.parentId === "0") {
      collectionData.parentId = null;
    }

    const collection = new Collection(collectionData);
    await collection.save();

    // If parentId is provided, add this collection's reference to the parent collection's childCollections
    if (collectionData.parentId || collectionData.parentId !== null) {
      const parentCollection = await Collection.findById(collectionData.parentId);
      if (parentCollection) {
        parentCollection.childCollections.push({ id: collection._id, type: 'Collection' });
        await parentCollection.save();
      }
    } else {
      // If parentId is null, add this collection to the user's mainCollection
      const user = await User.findById(req.user.id);
      user.mainCollection.push({ id: collection._id, type: 'Collection' });
      const addAyy = await user.save();
      console.log(addAyy);
    }

    res.status(201).json({
      statusCode: 201,
      message: 'Collection created successfully.',
      data: collection,
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

// Get all collections
exports.getCollections = async (req, res) => {
  try {
    // Fetch only the required fields: name, id, description, and parentId
    const collections = await Collection.find().select('name _id description parentId');

    res.status(200).json({
      statusCode: 200,
      message: 'Collections fetched successfully.',
      data: collections,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: 'An error occurred while fetching collections. Please try again later.',
      data: null,
    });
  }
};

// Get a collection by ID
exports.getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id).lean(); // Use lean to convert to a plain JavaScript object

    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    const childCollectionDetails = await Promise.all(collection.childCollections.map(async (child) => {
      if (child.type === 'Collection') {
        return await Collection.findById(child.id).lean();
      } else if (child.type === 'Item') {
        return await Item.findById(child.id).lean();
      }
    }));

    collection.childCollections = childCollectionDetails;

    res.status(200).json({
      statusCode: 200,
      message: 'Collection fetched successfully.',
      data: collection,
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

// Update a collection
exports.updateCollection = async (req, res) => {
  try {
    const collectionData = { ...req.body };

    // If modifiedBy is not provided, set it to req.user.id
    if (!collectionData.modifiedBy) {
      collectionData.modifiedBy = req.user.id;
    }

    // Prevent certain fields like _id from being updated
    delete collectionData._id;
    delete collectionData.createBy;
    delete collectionData.createAt;

    const collection = await Collection.findByIdAndUpdate(req.params.id, collectionData, { new: true, lean: true });

    if (!collection) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Collection not found. The provided ID does not match any existing collection.',
        data: null,
      });
    }

    // Return only relevant fields in the response
    const responseData = {
      _id: collection._id,
      name: collection.name,
      description: collection.description,
      parentId: collection.parentId,
      modifiedBy: collection.modifiedBy,
      modifiedAt: collection.modifiedAt,
    };

    res.status(200).json({
      statusCode: 200,
      message: 'Collection updated successfully.',
      data: responseData,
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

// Delete a collection
exports.deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Collection not found. The provided ID does not match any existing collection.',
        data: null,
      });
    }

    // Check if the parentId is null
    if (collection.parentId === null) {
      // Remove from user's mainCollection
      const user = await User.findById(collection.createBy);
      if (user) {
        user.mainCollection = user.mainCollection.filter(c => c.id.toString() !== req.params.id);
        await user.save();
      }
    } else {
      // Remove from parent collection's childCollections
      const parentCollection = await Collection.findById(collection.parentId);
      if (parentCollection) {
        parentCollection.childCollections = parentCollection.childCollections.filter(c => c.id.toString() !== req.params.id);
        await parentCollection.save();
      }
    }

    // Now delete the collection
    await collection.deleteOne();

    res.status(200).json({
      statusCode: 200,
      message: 'Collection successfully deleted.',
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

exports.shareCollection = async (req, res) => {
  try {
    const { collectionId, userIdToShareWith } = req.body;

    // Find the collection to be shared
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Collection not found. The provided ID does not match any collection.',
        data: null,
      });
    }

    // Check if the current user is the owner of the collection
    if (collection.createBy.toString() !== req.user.id) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Unauthorized action. You can only share your own collections.',
        data: null,
      });
    }

    // Validate that the user to share with exists
    const userToShareWith = await User.findById(userIdToShareWith);
    if (!userToShareWith) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Receiving user not found. The provided ID does not match any registered user.',
        data: null,
      });
    }

    // Ensure the collection has a `sharedWith` array
    if (!Array.isArray(collection.sharedWith)) {
      collection.sharedWith = [];
    }

    // Check if the collection is already shared with the user
    const alreadyShared = collection.sharedWith.some(share => share.to.toString() === userIdToShareWith);
    if (alreadyShared) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Collection is already shared with this user.',
        data: null,
      });
    }

    // Add the sharing information
    collection.sharedWith.push({
      to: userIdToShareWith,
      from: req.user.id,
      sharedAt: new Date()
    });

    // Save the updated collection
    await collection.save();

    res.status(200).json({
      statusCode: 200,
      message: 'Collection shared successfully.',
      data: {
        sharedWith: userToShareWith._id,
        collection: collection._id,
      },
    });
  } catch (error) {
    console.error('Error sharing collection:', error);

    res.status(500).json({
      statusCode: 500,
      message: 'An error occurred while sharing the collection. Please try again later.',
      data: null,
    });
  }
};



