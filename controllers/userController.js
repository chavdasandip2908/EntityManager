const Collection = require('../models/Collection');
const User = require('../models/User');
const Item = require('../models/Item');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

// login & token generate 
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean(); // Use lean to convert to a plain JavaScript object
    if (!user) return res.status(404).json({ message: 'User not found' });

    const mainCollectionDetails = await Promise.all(user.mainCollection.map(async (item) => {
      if (item.type === 'Collection') {
        return await Collection.findById(item.id).lean();
      } else if (item.type === 'Item') {
        return await Item.findById(item.id).lean();
      }
    }));

    user.mainCollection = mainCollectionDetails;

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
