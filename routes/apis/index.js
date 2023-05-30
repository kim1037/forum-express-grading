const express = require('express')
const router = express.Router()
const restController = require('../../controllers/apis/restaurant-controller')
const userController = require('../../controllers/apis/user-controller')
const { apiErrorHandler } = require('../../middleware/error-handler')
const { authenticated, authenticatedAdmin } = require('../../middleware/api-auth')
const passport = require('passport')

const admin = require('./modules/admin')
router.use('/admin', authenticated, authenticatedAdmin, admin)

// restaurants
router.get('/restaurants', authenticated, restController.getRestaurants)

// sign in // app.post(path, callback [, callback ...])
router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)

// error handler
router.use('/', apiErrorHandler)

module.exports = router
