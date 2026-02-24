import CustomRouter from './custom/custom.router';

export default class LinkClickRouter extends CustomRouter {
  init() {
    this.get('/linkclick', ['PUBLIC'], [], async (req, res) => {
      res.send('Get all link clicks');
    });
  }
}
