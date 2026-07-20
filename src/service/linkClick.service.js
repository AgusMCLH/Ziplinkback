import linkClickDAO from '../DAO/Mongo/linkClick.DAO.js';
import linkService from './links.service.js';
import geoip from 'geoip-lite';

class LinkClickService {
  async logClick(linkId, UAInfo, internalReferrer, personalReferrer, ip) {
    const res = await linkService.incrementClickCount(linkId);
    if (res.errorBool) {
      return {
        errorBool: true,
        errorStatus: res.errorStatus,
        errorMSG: 'Failed to increment click count',
      };
    }
    const isLocal = !ip || ip === '::1' || ip === '127.0.0.1'
    const geo = isLocal ? null : geoip.lookup(ip)

    const userAgentInfo = {
      ua: UAInfo.ua || 'Unknown',
      browser: UAInfo.browser.name || 'Unknown',
      deviceType: UAInfo.device.type || 'Unknown',
      internalReferrer: internalReferrer || 'None',
      personalReferrer: personalReferrer || 'None',
      ip: ip || 'Unknown',
      country: isLocal ? 'Local' : (geo?.country || 'Unknown'),
      city: isLocal ? 'Local' : (geo?.city || 'Unknown'),
    };
    return await linkClickDAO.createLinkClick(linkId, userAgentInfo);
  }
}

const linkClickService = new LinkClickService();

export default linkClickService;
