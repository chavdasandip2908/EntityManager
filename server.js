const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const itemRoutes = require('./routes/itemRoutes');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use('/api', userRoutes);
app.use('/api', collectionRoutes);
app.use('/api', itemRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));