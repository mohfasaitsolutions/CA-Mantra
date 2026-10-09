const { verifyJwt } = require('../utils/token');
const ROLES = require('../constants/roles');

function auth(required=true) {
  return (req,res,next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (!required) return next();
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const payload = verifyJwt(token);
    if (!payload) return res.status(401).json({ message: 'Invalid token' });
    req.user = payload;
    next();
  };
}

function requireRoles(...roles) {
  return (req,res,next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { auth, requireRoles, ROLES };
