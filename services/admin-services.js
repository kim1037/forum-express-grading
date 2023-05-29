const { Restaurant, User, Category } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const { imgurFileHandler } = require('../helpers/file-helpers')
const adminServices = {
  getRestaurants: async (req, cb) => {
    const DEFAULT_LIMIT = 10
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)
    try {
      const restaurants = await Restaurant.findAndCountAll({
        raw: true, // 把Sequelize包裝過的物件轉換成JS原生物件, 或在render後面寫成restaurant.toJSON()
        nest: true, // 把restaurant['Category.id'] => restaurant.category.id
        include: [Category],
        offset,
        limit
      })
      // 使用 findAndCountAll 回傳{count, rows:[{id..}],..}
      return cb(null, {
        restaurants: restaurants.rows,
        pagination: getPagination(limit, page, restaurants.count)
      })
    } catch (e) {
      cb(e)
    }
  },
  postRestaurant: (req, cb) => {
    const { name, tel, address, openingHours, description, categoryId } =
      req.body
    // 若name是空值就會終止程式碼，並在畫面顯示錯誤提示
    if (!name) throw new Error('Restaurant name is required!')
    const { file } = req // 把檔案取出來,同 const file = req.file
    imgurFileHandler(file) // 此為promise物件
      .then(filePath => {
        // create a new Restaurant instance and save it into db
        return Restaurant.create({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || null,
          categoryId
        })
      })
      .then(newRestaurant => {
        cb(null, { restaurant: newRestaurant })
      })
      .catch(err => cb(err))
  },
  deleteRestaurant: (req, cb) => {
    Restaurant.findByPk(req.params.id)
      .then(restaurant => {
        if (!restaurant) {
          const err = new Error("Restaurant didn't exist!")
          err.status = 404
          throw err
        }
        return restaurant.destroy()
      })
      .then(deletedRestaurant =>
        cb(null, {
          restaurant: deletedRestaurant
        })
      )
      .catch(e => cb(e))
  }
}

module.exports = adminServices
