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
    const now = new Date();
    links = links.map((link, i) => ({
      id: i + 1,
      _id: link._id,
      name: link.name,
      shortCode: link.shortCode,
      status: link.active && (!link.expireAt || link.expireAt.getTime() > now.getTime()) ? 'Active' : 'Expired',
      totalClicks: link.totalClicks,
      expirationDate: link.expireAt ? link.expireAt.toLocaleDateString() : null,
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
    const validStatuses = [true, false, 'active', 'inactive'];
    const resolvedStatus = validStatuses.includes(status) ? status : true;
    const days = user.plan === 'premium' ? 30 : 7;
    const expireAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const code = this.createShortCode();
      try {
        const result = await linkDAO.createLink(originalURL, name, resolvedStatus, userID, 0, code, expireAt);
        return result;
      } catch (err) {
        if (err?.code !== 11000 || attempt === MAX_RETRIES - 1) {
          return { errorBool: true, errorStatus: 500, errorMSG: 'Failed to create link' };
        }
      }
    }
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

  async deleteLink(linkId) {
    return await linkDAO.deleteLink(linkId);
  }
}

const linkService = new LinkService();

export default linkService;
