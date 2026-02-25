import CustomRouter from './custom/custom.router.js';
import userService from '../service/users.service.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';
import validateEmailNPass from '../middlewares/emailPass.middleware.js';

export default class UserRouter extends CustomRouter {
  init() {
    this.post(
      '/register',
      ['PUBLIC'],
      [validateEmailNPass(registerSchema)],
      async (req, res) => {
        const { email, password } = await req?.body;
        const result = await userService.register({ email, password });
        if (result.errorBool) {
          return res.status(result.errorStatus).json(result);
        }
        res.status(201).json(result);
      },
    );

    this.post(
      '/login',
      ['PUBLIC'],
      [validateEmailNPass(loginSchema)],
      async (req, res) => {
        const { email, password } = await req.body;
        const result = await userService.login({ email, password });
        if (result.errorBool) {
          return res.status(result.errorStatus).json(result);
        }
        res.cookie('access_token', result.data.token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 3 * 60 * 1000, // 3 minutos
          path: '/',
        });

        return res.json({
          errorBool: false,
          message: 'Login success',
          data: { user: result.data.user },
        });
      },
    );

    this.get('/logout', ['USER'], [], async (req, res) => {
      res.clearCookie('access_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      res.json({ status: 'success', message: 'Logged out successfully' });
    });
  }
}
