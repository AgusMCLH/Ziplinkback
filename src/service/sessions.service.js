import crypto from 'crypto';
import sessionDAO from '../DAO/Mongo/session.DAO.js';
import userService from './users.service.js';
import jwt from 'jsonwebtoken';

class SessionService {
  async createSession({ userID }) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const session = await sessionDAO.createSession({ userID, tokenHash });
    return { sessionObject: session, sessionToken };
  }

  async verifySession({ accessToken, sessionToken }) {
    if (!sessionToken) return null;

    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const session = await sessionDAO.getSessionByTokenHash(tokenHash);

    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await sessionDAO.destroySession({ tokenHash });
      return null;
    }

    if (accessToken) {
      try {
        jwt.verify(accessToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      } catch {
        // accessToken expired or invalid — session is still the source of truth
        // We still return the user based on the valid DB session
      }
    }

    return userService.getUserById(session.user.toString());
  }

  async destroySession({ sessionToken }) {
    if (!sessionToken) return null;
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    return sessionDAO.destroySession({ tokenHash });
  }
}

const sessionService = new SessionService();
export default sessionService;
