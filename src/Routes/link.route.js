import CustomRouter from './custom/custom.router';

export default class LinkRouter extends CustomRouter {
  init() {
    this.get('/links', ['PUBLIC'], [], async (req, res) => {
      res.send('Get all links');
    });

    this.post('/links', ['PUBLIC'], [], async (req, res) => {
      res.send('Create a new link');
    });

    this.get('/links/:id', ['PUBLIC'], [], async (req, res) => {
      res.send(`Get link with id ${req.params.id}`);
    });

    this.put('/links/:id', ['PUBLIC'], [], async (req, res) => {
      res.send(`Update link with id ${req.params.id}`);
    });

    this.delete('/links/:id', ['PUBLIC'], [], async (req, res) => {
      res.send(`Delete link with id ${req.params.id}`);
    });
  }
}
