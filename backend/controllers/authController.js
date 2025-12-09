const User = require('../models/userModel');
const Institution = require('../models/institutionModel');
const jwt = require('jsonwebtoken');
const sendgrid = require('@sendgrid/mail');

// Generate JWT Token
const generateToken = (userId, userRole) => {
    if (!userRole) {
        console.warn('No role provided for token generation!');
        userRole = 'student';
    }
    console.log('Generating token for:', { userId, userRole });
    const payload = { id: userId, role: userRole };
    console.log('Token payload:', payload);
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
    console.log('Generated token payload:', jwt.decode(token));
    return token;
};// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user with role
        const userRole = role || 'student';
        console.log('Creating user with role:', userRole);
        const user = await User.create({
            fullName,
            email,
            password,
            role: userRole
        });

        if (user) {
            // Send welcome email
            if (process.env.SENDGRID_API_KEY) {
                sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
                await sendgrid.send({
                    to: email,
                    from: process.env.FROM_EMAIL,
                    subject: 'Welcome to KavyaLearn',
                    text: `Welcome to KavyaLearn, ${fullName}!`,
                    html: `<h1>Welcome to KavyaLearn</h1><p>Dear ${fullName},</p><p>Thank you for joining KavyaLearn. We're excited to have you on board!</p>`
                });
            }

            console.log('User created with role:', user.role);
            const token = generateToken(user._id, userRole);

            res.status(201).json({
                message: 'Account successfully created',
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    token: token,
                },
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email }).select('+password +role');

        // Check if user exists and password matches
        if (user && (await user.matchPassword(password))) {
            // Update last login
            user.lastLogin = Date.now();
            
            // Set role if not already set
            if (!user.role) {
                user.role = 'student';
            }
            
            await user.save();

            // Use the generateToken function for consistency
            const token = generateToken(user._id, user.role);

            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                token: token,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password');

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.fullName = req.body.fullName || user.fullName;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            user.avatar = req.body.avatar || user.avatar;
            
            if (req.body.address) {
                user.address = {
                    ...user.address,
                    ...req.body.address
                };
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                role: updatedUser.role,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};