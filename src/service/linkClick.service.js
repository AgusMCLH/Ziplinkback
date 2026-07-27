import linkClickDAO from '../DAO/Mongo/linkClick.DAO.js';
import linkService from './links.service.js';

class LinkClickService {
  async logClick(linkId, UAInfo, internalReferrer, personalReferrer, ip, country, city) {
    const res = await linkService.incrementClickCount(linkId);
    if (!res || res.errorBool) {
      return {
        errorBool: true,
        errorStatus: res.errorStatus,
        errorMSG: 'Failed to increment click count',
      };
    }
    const userAgentInfo = {
      ua: UAInfo.ua || 'Unknown',
      browser: UAInfo.browser.name || 'Unknown',
      deviceType: UAInfo.device.type || 'Unknown',
      internalReferrer: internalReferrer || 'None',
      personalReferrer: personalReferrer || 'None',
      ip: ip || 'Unknown',
      country: country || 'Unknown',
      city: city || 'Unknown',
    };
    return await linkClickDAO.createLinkClick(linkId, userAgentInfo);
  }

  async getSummary(userId) {
    return linkClickDAO.getSummaryByUserId(userId);
  }
}

const linkClickService = new LinkClickService();

export default linkClickService;
