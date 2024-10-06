const Collection = require('../models/Collection');
const User = require('../models/User');
const Item = require('../models/Item');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const handleDuplicateKeyError = require('../config/common');

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      ...req.body,
      password: hashedPassword
    });
    const savedUser = await newUser.save();
    res.status(201).json({
      statusCode: 201,
      message: 'User created successfully.',
      data: savedUser,
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

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'name email image');

    res.status(200).json({
      statusCode: 200,
      message: 'Users fetched successfully.',
      data: users,
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

// login & token generate 
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        message: 'This email is not registered. Please sign up to create an account.',
        data: null,
      });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid email or password. Please try again.',
        data: null,
      });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return the token in the response
    res.status(200).json({
      statusCode: 200,
      message: 'Login successful.',
      data: {
        token: token,
        user: { id: user._id, name: user.name, email: user.email }
      },
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

// Get a user by ID
exports.getUserById = async (req, res) => {
  try {
    // Find the user by ID and convert the document to a plain JavaScript object
    const user = await User.findById(req.params.id).lean();

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found. The provided ID does not match any registered user.',
        data: null,
      });
    }

    // Fetch details of collections and items associated with the user
    // const mainCollectionDetails = await Promise.all(user.mainCollection.map(async (item) => {
    //   if (item.type === 'Collection') {
    //     return await Collection.findById(item.id).lean();
    //   } else if (item.type === 'Item') {
    //     return await Item.findById(item.id).lean();
    //   }
    // }));

    // // Replace the user's mainCollection with the detailed information
    // user.mainCollection = mainCollectionDetails;

    // Initialize counters for Collection and Item types
    let collectionCount = 0;
    let itemCount = 0;

    // Iterate over mainCollection to count the types
    user.mainCollection.forEach((item) => {
      if (item.type === 'Collection') {
        collectionCount++;
      } else if (item.type === 'Item') {
        itemCount++;
      }
    });

    const responseData = {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      image: user.image,
      collectionCount, // Count of 'Collection' type items
      itemCount, // Count of 'Item' type items
    };

    // Send the filtered user data as a response
    res.status(200).json({
      statusCode: 200,
      message: 'User details retrieved successfully.',
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

exports.getCollectionByUserId = async (req, res) => {
  try {
    // Find the user by ID and convert the document to a plain JavaScript object
    const user = await User.findById(req.params.id).lean();

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found. The provided ID does not match any registered user.',
        data: null,
      });
    }

    let collections = [];
    let items = [];

    // Iterate over mainCollection to count the types
    for (const item of user.mainCollection) {
      if (item.type === 'Collection') {
        const c = await Collection.findById(item.id);
        collections.push(c);
      }
      else if (item.type === 'Item') {
        const i = await Item.findById(item.id);
        items.push(i);
      }
    }



    const responseData = {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      image: user.image,
      collections, // Count of 'Collection' type items
      items, // Count of 'Item' type items
    };

    // Send the filtered user data as a response
    res.status(200).json({
      statusCode: 200,
      message: 'User details retrieved successfully.',
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

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };

    delete updateData.password;
    delete updateData.email;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, lean: true });

    if (!updatedUser) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found. The provided ID does not match any registered user.',
        data: null,
      });
    }

    // Send the updated user data as a response
    res.status(200).json({
      statusCode: 200,
      message: 'User updated successfully',
      data: updatedUser,
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

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    // Check if the user ID from the token matches the ID in the request parameters     
    if (req.user._id != req.params.id) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Unauthorized action. You can only delete your own account.',
        data: null,
      });
    }
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found. The provided ID does not match any registered user.',
        data: null,
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'User successfully deleted.',
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
