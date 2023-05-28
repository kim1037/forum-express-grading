const express = require('express')
const router = express.Router()
const adminController = require('../../../controllers/apis/admin-controller')
// const categoryController = require('../../../controllers/apis/category-controller')
// const upload = require('../../../middleware/multer')

router.delete('/restaurants/:id', adminController.deleteRestaurant)
router.get('/restaurants', adminController.getRestaurants)

module.exports = router
