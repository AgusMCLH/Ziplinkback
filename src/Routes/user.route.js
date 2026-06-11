import CustomRouter from './custom/custom.router.js';
import userService from '../service/users.service.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';
import validateEmailNPass from '../middlewares/emailPass.middleware.js';
import sessionService from '../service/sessions.service.js';

export default class UserRouter extends CustomRouter {
  init() {
    this.post(
      '/register',
      ['API'],
      [validateEmailNPass(registerSchema)],
      async (req, res) => {
        const { email, password, name } = await req?.body;
        const result = await userService.register({ email, password, name });
        if (result.errorBool) {
          return res.status(result.errorStatus).json(result);
        }
        res.status(201).json(result);
      },
    );

    this.post(
      '/login',
      ['API'],
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
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        });
        res.cookie('accessToken', result.data.accessToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        });
        res.cookie('sessionToken', result.data.sessionToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        });

        return res.json({
          errorBool: false,
          message: 'Login success',
          data: { user: result.data.user },
        });
      },
    );

    this.post('/verify-token', ['API'], [], async (req, res) => {
      const { sessionToken, accessToken } = req.body;

      if (!sessionToken) {
        return res
          .status(400)
          .json({ errorBool: true, message: 'Token is required' });
      }
      const user = await sessionService.verifySession({
        accessToken,
        sessionToken,
      });
      console.log(user);

      // const user = await userService.getUserByJWTToken(token);
      if (!user) {
        return res
          .status(401)
          .json({ errorBool: true, message: 'Invalid token' });
      }
      res.json({ errorBool: false, data: { user } });
    });

    this.get('/logout', ['API', 'USERS'], [], async (req, res) => {
      const sessionToken = req.cookies.sessionToken;
      console.log('ruta log: ', sessionToken);

      const result = await sessionService.destroySession({ sessionToken });
      res.clearCookie('access_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      });
      res.clearCookie('accessToken', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      });
      res.clearCookie('sessionToken', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      });
      res.json({ status: 'success', message: 'Logged out successfully' });
    });
  }
}
