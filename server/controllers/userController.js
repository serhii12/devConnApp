require('dotenv').config({ path: 'variables.env' });
import of from 'await-of';
const mongoose = require('mongoose');
const User = mongoose.model('User');
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

exports.validateRegister = [
    body('name', 'You must supply a name!')
        .not()
        .isEmpty(),
    body('email', 'Please include a valid email')
        .isEmail()
        .normalizeEmail({
            gmail_remove_dots: false,
            remove_extension: false,
            gmail_remove_subaddress: false,
        }),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next(); // there were no errors!
    },
];

exports.register = async (req, res, next) => {
    const { name, email, password } = req.body;
    let [resp, error] = await of(User.findOne({ email }));
    if (error) {
        return res.status(500).json({ errors: [error, { msg: 'Failed to get user by email' }] });
    }

    if (resp) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
    });

    let user = new User({
        name,
        email,
        avatar,
        password,
    });

    [resp, error] = await of(bcrypt.genSalt(10));
    if (error) {
        return res.status(400).json({ errors: [{ msg: 'Failed to get salt' }] });
    }

    [resp, error] = await of(bcrypt.hash(password, resp));
    if (error) {
        return res.status(400).json({ errors: [{ msg: 'Failed to hash password' }] });
    }

    user.password = resp;

    [, error] = await of(user.save());
    if (error) {
        return res.status(400).json({ errors: [{ msg: 'Failed to save user' }] });
    }

    const payload = {
        user: {
            id: user.id,
        },
    };

    jwt.sign(payload, process.env.SECRET, { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        res.json({ token });
    });
};
