const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri || mongoUri === 'your_mongodb_atlas_connection_string') {
        console.error(
            'MongoDB connection failed: set MONGO_URI in backend/.env to your MongoDB Atlas connection string.'
        );
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000
        });

        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

const getDatabaseStatus = () => {
    return mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected';
};

module.exports = {
    connectDB,
    getDatabaseStatus
};