const { Restaurant, User, Category } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

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
      return cb(null,
        {
          restaurants: restaurants.rows,
          pagination: getPagination(limit, page, restaurants.count)
        })
    } catch (e) { cb(e) }
  }
}

module.exports = adminServices
