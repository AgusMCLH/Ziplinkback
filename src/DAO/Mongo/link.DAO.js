import { length } from 'zod';
import Link from './../../models/link.model.js';

class LinkDAO {
  async findByShortCode(shortCode) {
    return Link.findOne({ shortCode }).exec();
  }

  async createLink(originalUrl, name, status, user, totalClicks, code, expireAt) {
    console.log('status', status);

    const [doc] = await Link.create([
      {
        originalUrl,
        name,
        active: status,
        user,
        totalClicks,
        shortCode: code,
        expireAt,
      },
    ]);
    return doc;
  }

  async getLinkById(id) {
    return Link.findById(id).exec();
  }

  async getLinksByUserID(userID) {
    return Link.find({ user: userID }).exec();
  }

  async getLinkByLinkIDandUserID(linkId, userID) {
    let result = await Link.findOne({
      originalUrl: { $regex: linkId, $options: 'i' },
      user: userID,
    }).exec();
    if (result === null || result === undefined || result === false) {
      result = false;
    }
    return result;
  }

  async updateClickCount(linkId) {
    return await this.updateLink(linkId, { $inc: { totalClicks: 1 } });
  }

  async updateLink(linkId, updateData) {
    return await Link.findByIdAndUpdate(linkId, updateData, {
      new: true,
    }).exec();
  }

  async getLinksDataByUserID(userID) {
    return Link.find({ user: userID }).select('name shortCode totalClicks active').exec();
  }
}

const linkDAO = new LinkDAO();

export default linkDAO;
