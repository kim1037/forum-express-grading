const express = require('express')
const router = express.Router()
const restController = require('../../controllers/apis/restaurant-controller')
const { apiErrorHandler } = require('../../middleware/error-handler')

const admin = require('./modules/admin')
router.use('/admin', admin)

router.get('/restaurants', restController.getRestaurants)

router.use('/', apiErrorHandler)

module.exports = router
