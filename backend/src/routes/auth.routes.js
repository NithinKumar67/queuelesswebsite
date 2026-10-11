const express = require('express');

const {
    register,
    login,
    logout,
    getCurrentUser
} = require('../controllers/auth.controller');

const wrapAsync = require('../utils/wrapAsync');
const validate = require('../middleware/validate');
const {
    registerSchema,
    loginSchema
} = require('../schemas/auth.schema');

const router = express.Router();


// Register
router.post(
    '/register',
    validate(registerSchema),
    wrapAsync(register)
);


// Login
router.post(
    '/login',
    validate(loginSchema),
    login
);


// Logout
router.post('/logout', logout);


// Current user
router.get('/me', getCurrentUser);


module.exports = router;