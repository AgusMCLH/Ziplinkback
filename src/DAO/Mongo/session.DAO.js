import sessionModel from '../../models/session.model.js';
import config from '../../config/env.config.js';

class SessionDAO {
  async getSessionByTokenHash(tokenHash) {
    return sessionModel.findOne({ tokenHash }).exec();
  }

  async createSession({ userID, tokenHash }) {
    const session = await sessionModel.create({
      user: userID,
      tokenHash,
      expiresAt: new Date(Date.now() + config.SESSION_TTL_MS),
    });
    return session;
  }

  async destroySession({ tokenHash }) {
    return sessionModel.deleteOne({ tokenHash }).exec();
  }

  async destroyAllSessionsForUser(userID) {
    return sessionModel.deleteMany({ user: userID }).exec();
  }
}

const sessionDAO = new SessionDAO();
export default sessionDAO;
