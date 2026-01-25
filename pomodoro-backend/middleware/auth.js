const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log(`[AUTH] Authentication failed: No token provided for ${req.method} ${req.path}`);
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    console.log(`[AUTH] Authenticated user: ${req.userId} for ${req.method} ${req.path}`);
    next();
  } catch (error) {
    console.log(`[AUTH] Authentication failed: Invalid token for ${req.method} ${req.path}`);
    res.status(401).json({ message: 'Authentication required' });
  }
};

