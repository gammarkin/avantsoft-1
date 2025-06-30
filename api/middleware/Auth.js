import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'awpsecretkey';

const authenticate = (req, res, next) => {
  if (req.path === '/login' || req.path === '/register') {
    return next();
  }

  const token = req.headers.authorization
  if (!token) return res.status(401).send({ message: 'Access denied', token: `Bearer ${token}` });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ message: 'Invalid token' });
  }
};

export default authenticate;