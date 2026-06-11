import crypto from 'crypto';
import sessionDAO from '../DAO/Mongo/session.DAO.js';
import userService from './users.service.js';
import jwt from 'jsonwebtoken';

class SessionService {
  constructor() {}
  async createSession({ userID }) {
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const session = await sessionDAO.createSession({
      userID,
      tokenHash,
      sessionToken,
    });
    return { sessionObject: session, sessionToken };
  }
  async verifySession({ accessToken, sessionToken }) {
    if (accessToken) {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      console.log(decoded);
      const user = await userService.getUserById(decoded.sub);
      return user;
    }
  }
  async destroySession({ sessionToken }) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(sessionToken)
      .digest('hex');
    console.log('Service log: ', tokenHash);

    const result = await sessionDAO.destroySession({ tokenHash });
    return result;
  }
}

const sessionService = new SessionService();

export default sessionService;
