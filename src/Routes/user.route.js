import CustomRouter from './custom/custom.router.js';
import userService from '../service/users.service.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';
import validateEmailNPass from '../middlewares/emailPass.middleware.js';
import sessionService from '../service/sessions.service.js';
import { loginLimiter, registerLimiter, verifyTokenLimiter } from '../middlewares/rateLimiter.js';

export default class UserRouter extends CustomRouter {
  init() {
    this.post('/register', ['API'], [registerLimiter, validateEmailNPass(registerSchema)], async (req, res) => {
      const { email, password, name } = req.body;
      const result = await userService.register({ email, password, name });
      if (result.errorBool) return res.status(result.errorStatus).json(result);
      res.status(201).json(result);
    });

    this.post('/login', ['API'], [loginLimiter, validateEmailNPass(loginSchema)], async (req, res) => {
      const { email, password } = req.body;
      const result = await userService.login({ email, password });
      if (result.errorBool) return res.status(result.errorStatus).json(result);

      const cookieOpts = {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      };

      res.cookie('access_token', result.data.token, { ...cookieOpts, maxAge: 60 * 60 * 1000 });
      res.cookie('sessionToken', result.data.sessionToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

      return res.json({ errorBool: false, message: 'Login success', data: { user: result.data.user } });
    });

    this.post('/verify-token', ['API'], [verifyTokenLimiter], async (req, res) => {
      const { sessionToken, accessToken } = req.body;
      if (!sessionToken) {
        return res.status(400).json({ errorBool: true, message: 'sessionToken is required' });
      }
      const user = await sessionService.verifySession({ accessToken, sessionToken });
      if (!user) {
        return res.status(401).json({ errorBool: true, message: 'Invalid or expired session' });
      }

      // Issue a fresh access_token so the caller can silently renew it
      const freshToken = userService.signAccessToken(user._id.toString());
      res.json({ errorBool: false, data: { user, freshToken } });
    });

    this.get('/logout', ['API', 'USERS'], [], async (req, res) => {
      const sessionToken = req.cookies.sessionToken;
      if (sessionToken) {
        await sessionService.destroySession({ sessionToken });
      }
      const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
      res.clearCookie('access_token', cookieOpts);
      res.clearCookie('sessionToken', cookieOpts);
      res.json({ status: 'success', message: 'Logged out successfully' });
    });
  }
}
