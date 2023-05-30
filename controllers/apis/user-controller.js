const jwt = require('jsonwebtoken')
const userServices = require('../../services/user-services')

const userController = {
  signIn: (req, res, next) => {
    try {
      const userData = req.user.toJSON()
      delete userData.password // delete object.property 刪除敏感資料
      // 用法: jwt.sign(payload, secretOrPrivateKey, [options, callback])
      const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' }) // 效期30天
      return res.json({
        status: 'success',
        data: {
          token,
          user: userData
        }
      })
    } catch (err) { // 和.catch{...} 差別在於後者只能承接promise物件, jwt.sign不是非同步事件,不會回傳promise
      next(err)
    }
  },
  signUp: (req, res, next) => {
    userServices.signUp(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  }
}

module.exports = userController
