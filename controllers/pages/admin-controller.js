const { Restaurant, User, Category } = require('../../models')
const { imgurFileHandler } = require('../../helpers/file-helpers')
const adminServices = require('../../services/admin-services')

const adminController = {
  getRestaurants: (req, res, next) => {
    adminServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('admin/restaurants', data))
  },
  // create restaurant page
  createRestaurant: (req, res, next) => {
    return Category.findAll({ raw: true })
      .then(categories => {
        res.render('admin/create-restaurant', { categories })
      }).catch(e => next(e))
  },
  // create new restaurant
  postRestaurant: (req, res, next) => {
    adminServices.postRestaurant(req, (err, data) => {
      if (err) return next(err)
      req.flash('success_messages', 'restaurant was successfully created')
      req.session.createdData = data
      return res.redirect('/admin/restaurants')
    })
  },
  // show a restaurant details
  getRestaurant: (req, res, next) => {
    Restaurant.findByPk(req.params.id, {
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error('Restaurant does not exist.')
        res.render('admin/restaurant', { restaurant })
      })
      .catch(e => next(e))
  },
  editRestaurant: (req, res, next) => {
    return Promise.all([
      Restaurant.findByPk(req.params.id, { raw: true }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurant, categories]) => {
        // 先檢查餐廳是否存在, 不存在則拋出錯誤訊息
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        // 存在的話顯示edit page
        res.render('admin/edit-restaurant', { restaurant, categories })
      })
      .catch(e => next(e))
  },
  // edit restaurant
  putRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    if (!name) throw new Error('Restaurant name is required!')
    const { file } = req
    // 此處不加raw, 才可以使用sequelize instance物件的update function
    Promise.all([Restaurant.findByPk(req.params.id), imgurFileHandler(file)])
      .then(([restaurant, filePath]) => {
        // restaurant是sequelize instance物件
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        // 加上return減少巢狀的層數
        // 也可以使用Restaurant.update 但要加上 id
        return restaurant.update({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || restaurant.image, // 如果 使用者有上傳新照片filePath=Truthy，使用者沒有上傳新照片，就沿用原本資料庫內的值
          categoryId
        })
      })
      .then(() => {
        req.flash('success_messages', 'restaurant was successfully updated')
        res.redirect('/admin/restaurants')
      })
      .catch(e => next(e))
  },
  deleteRestaurant: (req, res, next) => {
    adminServices.deleteRestaurant(req, (err, data) => {
      if (err) return next(err)
      req.session.deletedData = data
      return res.redirect('/admin/restaurants')
    }
    )
  },
  getUsers: (req, res, next) => {
    return User.findAll({
      raw: true // 把Sequelize包裝過的物件轉換成JS原生物件
    })
      .then(users => res.render('admin/users', { users }))
      .catch(e => next(e))
  },
  patchUser: (req, res, next) => {
    return User.findByPk(req.params.id)
      .then(user => {
        if (!user) throw new Error("User didn't exist!")
        if (user.email === 'root@example.com') {
          req.flash('error_messages', '禁止變更 root 權限')
          return res.redirect('back')
        } else {
          return user.update({
            isAdmin: !user.isAdmin
          })
        }
      })
      .then(() => {
        req.flash('success_messages', '使用者權限變更成功')
        res.redirect('/admin/users')
      })
      .catch(e => next(e))
  }
}

module.exports = adminController
