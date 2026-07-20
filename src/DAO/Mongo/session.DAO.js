import sessionModel from '../../models/session.model.js';

class SessionDAO {
  async getSessionByTokenHash(tokenHash) {
    return sessionModel.findOne({ tokenHash }).exec();
  }

  async createSession({ userID, tokenHash }) {
    const session = await sessionModel.create({
      user: userID,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
