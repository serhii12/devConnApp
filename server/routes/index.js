const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');

// router.post('/login', authController.login);

// 1. Validate the registration data
// 2. register the user
// 3. we need to log them in
router.post(
    '/register',
    userController.validateRegister,
    userController.register
    // authController.login
);

module.exports = router;
