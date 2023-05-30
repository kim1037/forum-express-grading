const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportJWT = require('passport-jwt')
const bcrypt = require('bcryptjs')
const { User, Restaurant } = require('../models')

const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

const jwtOptions = {
  // 指定從authorization header裡的bearer來找token
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  // 使用密鑰檢查 token 是否經過纂改
  secretOrKey: process.env.JWT_SECRET
}

// set up Passport strategy
passport.use(
  new LocalStrategy( // LocalStrategy(option, function)
  // option : customize user field
    { usernameField: 'email', passReqToCallback: true },
    // function : authenticate user
    async (req, email, password, done) => {
      try {
        const user = await User.findOne({ where: { email } })
        if (!user) {
          return done(
            null,
            false,
            req.flash('error_messages', '帳號或密碼輸入錯誤！')
          )
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
          return done(
            null,
            false,
            req.flash('error_messages', '帳號或密碼輸入錯誤！')
          )
        }
        return done(null, user)
      } catch (err) {
        return done(err, false)
      }
    }
  )
)
passport.use(
  new JWTStrategy(jwtOptions, (jwtPayload, done) => {
    User.findByPk(jwtPayload.id, {
      include: [
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: Restaurant, as: 'LikedRestaurants' },
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' }
      ]
    })
      .then(user => done(null, user))
      .catch(e => done(e, null))
  })
)
// serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id)
})
passport.deserializeUser((id, done) => {
  User.findByPk(id, {
    include: [
      { model: Restaurant, as: 'FavoritedRestaurants' },
      { model: Restaurant, as: 'LikedRestaurants' },
      { model: User, as: 'Followers' },
      { model: User, as: 'Followings' }
    ]
  })
    .then(user => {
      done(null, user.toJSON())
    })
    .catch(e => done(e, null))
})

module.exports = passport
