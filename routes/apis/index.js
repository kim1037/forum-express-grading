const express = require('express')
const router = express.Router()
const restController = require('../../controllers/apis/restaurant-controller')
const userController = require('../../controllers/apis/user-controller')
const { apiErrorHandler } = require('../../middleware/error-handler')
const passport = require('passport')

const admin = require('./modules/admin')
router.use('/admin', admin)

// sign in // app.post(path, callback [, callback ...])
router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)

// restaurants
router.get('/restaurants', restController.getRestaurants)

// error handler
router.use('/', apiErrorHandler)

module.exports = router
