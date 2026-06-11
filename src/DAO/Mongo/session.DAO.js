import sessionModel from '../../models/session.model.js';

class SessionDAO {
  constructor() {}
  async getSessionByTokenHash() {}
  async createSession({ userID, tokenHash, expireAt }) {
    try {
      const session = await sessionModel.create({
        user: userID,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      return session;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  async verifySession() {}
  async destroySession({ tokenHash }) {
    try {
      const result = await sessionModel.deleteOne({
        tokenHash,
      });
      console.log('DAO log: ', result);

      return result;
    } catch (error) {
      console.log(error);
      return -1;
    }
  }
}

const sessionDAO = new SessionDAO();
export default sessionDAO;
