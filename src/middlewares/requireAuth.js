import jwt from 'jsonwebtoken';
import config from './../config/env.config.js';

export default function auth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token)
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
}
