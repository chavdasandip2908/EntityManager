const Collection = require('../models/Collection');
const User = require('../models/User');
const Item = require('../models/Item');


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
      console.log("prent present");
      const parentCollection = await Collection.findById(collectionData.parentId);
      if (parentCollection) {
        parentCollection.childCollections.push({ id: collection._id, type: 'Collection' });
        await parentCollection.save();
      }
    } else {
      // If parentId is null, add this collection to the user's mainCollection
      console.log("perent no present");
      const user = await User.findById(req.user.id);
      user.mainCollection.push({ id: collection._id, type: 'Collection' });
      const addAyy=await user.save();
      console.log(addAyy);
    }

    res.status(201).json(collection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all collections
exports.getCollections = async (req, res) => {
  try {
    const collections = await Collection.find();
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a collection
exports.updateCollection = async (req, res) => {
  try {
    const collectionData = req.body;

    // If modifiedBy is not provided, set it to req.user.id
    if (!collectionData.modifiedBy) {
      collectionData.modifiedBy = req.user.id;
    }

    const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    res.json(collection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a collection
exports.deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findByIdAndDelete(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    res.json({ message: 'Collection deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
