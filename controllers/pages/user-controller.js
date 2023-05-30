const { User, Comment, Restaurant, Favorite, Like, Followship } = require('../../models')
const { imgurFileHandler } = require('../../helpers/file-helpers')
const userServices = require('../../services/user-services')

const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    userServices.signUp(req, (err, data) => {
      if (err) return next(err)
      req.flash('success_messages', '成功註冊帳號！') // 顯示成功訊息
      req.session.createdUserData = data
      return res.redirect('/signin')
    })
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },
  logout: (req, res) => {
    req.flash('success_messages', '成功登出！')
    req.logout()
    res.redirect('/signin')
  },
  getUser: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [
          { model: Restaurant, as: 'FavoritedRestaurants', attributes: ['id', 'image'] },
          { model: User, as: 'Followings', attributes: ['id', 'image'] },
          { model: User, as: 'Followers', attributes: ['id', 'image'] }]
      })
      const comments = await Comment.findAll({
        where: { userId: req.params.id },
        include: [{
          model: Restaurant,
          attributes: ['id', 'image']
        }],
        group: ['restaurantId'], // 避免重複
        raw: true,
        nest: true
      })
      if (!user) throw new Error("User didn't exist.")
      return res.render('users/profile', {
        user: user.toJSON(),
        comments
      })
    } catch (e) { next(e) }
  },
  editUser: (req, res, next) => {
    return User.findByPk(req.params.id, { raw: true })
      .then(user => {
        if (!user) throw new Error("User didn't exist.")
        return res.render('users/edit', { user })
      })
      .catch(e => next(e))
  },
  putUser: (req, res, next) => {
    const { name } = req.body
    const { file } = req
    if (!name) throw new Error('Name is required!')
    return Promise.all([User.findByPk(req.params.id), imgurFileHandler(file)])
      .then(([user, filePath]) => {
        if (!user) throw new Error("User didn't exist.")
        return user.update({
          name: name.trim(),
          image: filePath || user.image
        })
      })
      .then(user => {
        req.flash('success_messages', '使用者資料編輯成功')
        return res.redirect(`/users/${req.params.id}`)
      })
      .catch(e => next(e))
  },
  addFavorite: (req, res, next) => {
    const { restaurantId } = req.params
    const userId = req.user.id
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({ where: { userId, restaurantId } })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (favorite) throw new Error('You have favorited this restaurant!')
        return Favorite.create({ restaurantId, userId })
      })
      .then(() => res.redirect('back'))
      .catch(e => next(e))
  },
  removeFavorite: (req, res, next) => {
    const { restaurantId } = req.params
    const userId = req.user.id

    return Favorite.findOne({ where: { userId, restaurantId } })
      .then(favorite => {
        if (!favorite) {
          throw new Error("You haven't favorited this restaurant!")
        }

        return favorite.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(e => next(e))
  },
  addLike: (req, res, next) => {
    const { restaurantId } = req.params
    const userId = req.user.id
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Like.findOne({ where: { userId, restaurantId } })
    ])
      .then(([restaurant, like]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (like) throw new Error('You have liked this restaurant!')
        return Like.create({ restaurantId, userId })
      })
      .then(() => res.redirect('back'))
      .catch(e => next(e))
  },
  removeLike: (req, res, next) => {
    const { restaurantId } = req.params
    const userId = req.user.id

    return Like.findOne({ where: { userId, restaurantId } })
      .then(like => {
        if (!like) {
          throw new Error("You haven't liked this restaurant!")
        }

        return like.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(e => next(e))
  },
  getTopUsers: (req, res, next) => {
    return User.findAll({
      include: [{ model: User, as: 'Followers' }]
    })
      .then(users => {
        // 重整所有users資料
        users = users
          .map(user => ({
            ...user.toJSON(),
            // 追蹤人數
            followerCount: user.Followers.length,
            // 目前登入帳號是否有追蹤此user
            isFollowed: req.user && req.user.Followings.some(f => f.id === user.id)
          }))
          .sort((a, b) => b.followerCount - a.followerCount)
        // sort會以字典順序來排, 要比較[a,b], a=b 回傳0 排序不動, a>b 回傳負值 a在b前， a<b 回傳正值 b在a前

        res.render('top-users', { users })
      })
      .catch(e => next(e))
  },
  addFollowing: (req, res, next) => {
    const { userId } = req.params
    return Promise.all([
      User.findByPk(userId),
      Followship.findOne({
        where: {
          followerId: req.user.id,
          followingId: userId
        }
      })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) {
          throw new Error('You are already following this user!')
        }
        return Followship.create({
          followerId: req.user.id,
          followingId: userId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFollowing: (req, res, next) => {
    const { userId } = req.params
    return Followship.findOne({
      where: {
        followingId: userId,
        followerId: req.user.id
      }
    })
      .then(followship => {
        if (!followship) {
          throw new Error("You haven't followed this user!")
        }

        return followship.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(e => next(e))
  }
}

module.exports = userController
