const passport = require('passport');

const User = require('../models/User');
const ExpressError = require('../utils/ExpressError');
const { getCookieOptions } = require('../config/env');

// REGISTER

const register = async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        throw new ExpressError(
            400,
            'Name, email, and password are required'
        );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        throw new ExpressError(
            409,
            'Email is already registered'
        );
    }

    const newUser = new User({
        name,
        email: normalizedEmail,
        phone,
        role: 'citizen'
    });

    const registeredUser = await User.register(
        newUser,
        password
    );

    res.status(201).json({
        message: 'Registration successful',
        user: {
            id: registeredUser._id,
            name: registeredUser.name,
            email: registeredUser.email,
            role: registeredUser.role
        }
    });
};

// LOGIN

const login = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(
            new ExpressError(400, "Email and password are required")
        );
    }

    const normalizedEmail = email.trim().toLowerCase();
    req.body.email = normalizedEmail;
    req.body.username = normalizedEmail;

    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return next(
                new ExpressError(
                    401,
                    info?.message || "Password or username is incorrect"
                )
            );
        }

        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }

            res.status(200).json({
                message: "Login successful",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    officeId: user.officeId || null,
                    counterId: user.counterId || null
                }
            });
        });
    })(req, res, next);
};

// LOGOUT

const logout = (req, res, next) => {

    req.logout((err) => {

        if (err) {
            return next(err);
        }

        req.session.destroy((err) => {

            if (err) {
                return next(err);
            }

            // Cookie attributes must match those used when it was set.
            const { maxAge, ...cookieOptions } = getCookieOptions();
            res.clearCookie('connect.sid', cookieOptions);

            res.status(200).json({
                message: 'Logout successful'
            });
        });
    });
};

// CURRENT USER

const getCurrentUser = (req, res) => {

    if (!req.isAuthenticated()) {
        return res.status(200).json({
            authenticated: false,
            user: null
        });
    }

    res.status(200).json({
        authenticated: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            officeId: req.user.officeId || null,
            counterId: req.user.counterId || null
        }
    });
};


module.exports = {
    register,
    login,
    logout,
    getCurrentUser
};