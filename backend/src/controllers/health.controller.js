const { getDatabaseStatus } = require('../config/db');

const getHealth = (req, res) => {
    const database = getDatabaseStatus();

    res.status(200).json({
        success: true,
        message: 'QueueLess backend is running',
        database
    });
};

module.exports = {
    getHealth
};
