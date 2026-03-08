import { length } from 'zod';
import Link from './../../models/link.model.js';

class LinkDAO {
  async findByShortCode(shortCode) {
    console.log('recibo ', shortCode);

    return Link.findOne({ shortCode }).exec();
  }

  async createLink(originalUrl, user, totalClicks, code, expireAt) {
    console.log(originalUrl, user, totalClicks, code, expireAt);

    const [doc] = await Link.create([
      { originalUrl, user, totalClicks, shortCode: code, expireAt },
    ]);
    return doc;
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
    return await Link.findByIdAndUpdate(
      linkId,
      { $inc: { totalClicks: 1 } },
      { new: true },
    ).exec();
  }
}

const linkDAO = new LinkDAO();

export default linkDAO;
