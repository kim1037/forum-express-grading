const { Restaurant, Category, Comment, User } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')

const restaruantController = {
  getRestaurants: async (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        {
          model: Comment,
          include: User,
          // 排序comment從新到舊, 在多層include情況，separate 和 order要搭配一起用
          separate: true,
          order: [['createdAt', 'DESC']]
        },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ], // 拿出關聯的 Category model
      nest: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        const isFavorited = restaurant.FavoritedUsers.some(
          f => f.id === req.user.id
        )
        const isLiked = restaurant.LikedUsers.some(
          l => l.id === req.user.id
        )
        restaurant.increment('viewCounts')
        return res.render('restaurant', {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => next(err))
  },
  getDashboard: async (req, res, next) => {
    try {
      const restaurant = await Restaurant.findByPk(req.params.id, {
        include: [Category, Comment, { model: User, as: 'FavoritedUsers' }],
        nest: true
      })
      if (!restaurant) throw new Error("Restaurant didn't exist!")
      res.render('dashboard', { restaurant: restaurant.toJSON() })
    } catch (e) {
      next(e)
    }
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', {
          restaurants,
          comments
        })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    const maxLength = 150
    // 目前註解掉的部分會使test fail
    return Restaurant.findAll({
      include: [
        { model: User, as: 'FavoritedUsers' }
        // ,{ model: User, as: 'LikedUsers' }
      ]
    })
      .then(restaurants => {
        restaurants = restaurants
          .map(rest => ({
            ...rest.toJSON(),
            description: rest.description.substring(0, maxLength) + '...',
            favoritedCount: rest.FavoritedUsers.length,
            isFavorited:
              req.user &&
              req.user.FavoritedRestaurants.some(f => f.id === rest.id)
            // ,isLiked: req.user && req.user.LikedRestaurants.some(l => l.id === rest.id)
          }))
          .filter(r => r.favoritedCount > 0) // 只顯示收藏數>0的餐廳
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
          .slice(0, 10)
        res.render('top-restaurants', { restaurants })
      })
      .catch(err => next(err))
  }

}

module.exports = restaruantController
