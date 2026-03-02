import linkDAO from '../DAO/Mongo/link.DAO.js';
import userService from './users.service.js';

class LinkService {
  constructor() {}
  createShortCode() {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode = '';
    for (let i = 0; i < 6; i++) {
      shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return shortCode;
  }

  async getLinkByShortCode(shortCode) {
    const link = await linkDAO.findByShortCode(shortCode);
    if (!link) {
      return {
        errorBool: true,
        errorStatus: 404,
        errorMSG: 'Link not found',
      };
    }
    return link;
  }

  async createLink({ originalURL, userID }) {
    const user = await userService.getUserById(userID);
    if (!user) {
      return {
        errorBool: true,
        errorStatus: 404,
        errorMSG: 'User not found',
      };
    }
    const days = user.plan === 'premium' ? 30 : 7;
    const expireAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    let code = this.createShortCode();
    const existing = await linkDAO.findByShortCode(code);
    while (existing) {
      code = this.createShortCode();
      existing = await linkDAO.findByShortCode(code);
    }
    const result = await linkDAO.createLink(
      originalURL,
      userID,
      0,
      code,
      expireAt,
    );
    return result;
  }
}

const linkService = new LinkService();

export default linkService;
