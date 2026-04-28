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

  async getLinksByUserID(userID) {
    let links = await linkDAO.getLinksByUserID(userID);
    links = links.map((link, i) => ({
      id: i + 1,
      _id: link._id,
      name: link.name,
      shortCode: link.shortCode,
      status: link.active ? 'Active' : 'Expired',
      totalClicks: link.totalClicks,
      expirationDate: link.expireAt ? link.expireAt.toLocaleDateString() : null, //DD/MM/YYYY
      originalURL: link.originalUrl,
    }));
    return links;
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

  async createLink({ originalURL, name, status, userID }) {
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
      name,
      status,
      userID,
      0,
      code,
      expireAt,
    );
    return result;
  }

  async incrementClickCount(linkId) {
    return await linkDAO.updateClickCount(linkId);
  }

  async getLinkById(id) {
    return await linkDAO.getLinkById(id);
  }

  async getLinkByLinkIDandUserID(linkId, userID) {
    return await linkDAO.getLinkByLinkIDandUserID(linkId, userID);
  }

  async updateLink(linkId, updateData) {
    return await linkDAO.updateLink(linkId, updateData);
  }
}

const linkService = new LinkService();

export default linkService;
