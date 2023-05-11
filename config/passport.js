const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcryptjs')
const { User } = require('../models')

module.exports = app => {
  app.use(passport.initialize())
  app.use(passport.session())
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
  // serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })
  passport.deserializeUser((id, done) => {
    User.findByPk(id)
      .then(user => {
        user = user.toJSON()
        console.log(user) // for temporary
        done(null, user)
      })
      .catch(e => done(e, null))
  })
}