const bcrypt = require('bcryptjs') // 載入 bcrypt
const { User } = require('../models')

const userController = {
  signUp: (req, cb) => {
    const { name, email, password, passwordCheck } = req.body

    // 如果兩次輸入的密碼不同，就建立一個 Error 物件並拋出
    if (password !== passwordCheck) {
      throw new Error('Passwords do not match!')
    }
    // 確認 email 是否已註冊，如有就建立一個 Error 物件並拋出
    User.findOne({ where: { email } })
      .then(user => {
        if (user) {
          throw new Error('Email already exists!')
        }
        return bcrypt.hash(password, 10)
      })
      .then(hash => {
        return User.create({
          name,
          email,
          password: hash
        })
      })
      .then(newUser => {
        const user = newUser.toJSON()
        delete user.password
        return cb(null, { user })
      })
      .catch(e => cb(e)) // 接住前面拋出的錯誤，呼叫專門做錯誤處理的 middleware
  }
}

module.exports = userController
