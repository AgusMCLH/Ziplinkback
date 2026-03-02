import linkClickDAO from '../DAO/Mongo/linkClick.DAO.js';
import linkService from './links.service.js';

class LinkClickService {
  async logClick(linkId, UAInfo, referer, ip) {
    console.log(UAInfo);
    const res = await linkService.incrementClickCount(linkId);
    if (res.errorBool) {
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
      referer: referer || 'None',
      ip: ip || 'Unknown',
    };
    return await linkClickDAO.createLinkClick(linkId, userAgentInfo);
  }
}

const linkClickService = new LinkClickService();

export default linkClickService;
