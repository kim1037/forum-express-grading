const passport = require('../config/passport')

const authenticated = (req, res, next) => {
  // passport.authenticate會回傳function，我們要立刻執行所以後面會加上(req, res, next) 可把整段看成是middleware(req, res, next)
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) { return res.status(401).json({ status: 'error', message: 'unauthorized' }) }
    req.user = user // 需自行處理驗證成功的回應, 但post admin時還是會出問題，待解
    next()
  })(req, res, next)
}
const authenticatedAdmin = (req, res, next) => {
  console.log('req:', req.user)
  if (req.user && req.user.isAdmin) {
    return next()
  }
  return res
    .status(403)
    .json({ status: 'error', message: 'permission denied' })
}
module.exports = {
  authenticated,
  authenticatedAdmin
}
