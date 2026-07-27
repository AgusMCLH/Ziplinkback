import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sessionModel from '../../models/session.model.js';
import config from '../../config/env.config.js';

export default class CustomRouter {
  constructor() {
    this.router = Router();
    this.init();
  }

  init() {}
  getRouter() { return this.router; }

  get(path, policies, middlewares, ...callback) {
    this.router.get(path, this.#handlerPolicies(policies), this.#handelerMiddleware(middlewares), this.#applyCallback(callback));
  }
  post(path, policies, middlewares, ...callback) {
    this.router.post(path, this.#handlerPolicies(policies), this.#handelerMiddleware(middlewares), this.#applyCallback(callback));
  }
  put(path, policies, middlewares, ...callback) {
    this.router.put(path, this.#handlerPolicies(policies), this.#handelerMiddleware(middlewares), this.#applyCallback(callback));
  }
  delete(path, policies, middlewares, ...callback) {
    this.router.delete(path, this.#handlerPolicies(policies), this.#handelerMiddleware(middlewares), this.#applyCallback(callback));
  }

  #applyCallback(callbacks) {
    if (callbacks.length > 1) callbacks = [callbacks[callbacks.length - 1]];
    return callbacks.map((callback) => async (...params) => {
      try {
        await callback.apply(this, params);
      } catch (error) {
        console.error('[router] unhandled error:', error?.message);
        params[1].status(500).json({ status: 'Internal Server Error' });
      }
    });
  }

  #handlerPolicies = (policies) => async (req, res, next) => {
    policies = policies.length === 0 ? ['PUBLIC'] : policies;
    if (policies[0] === 'PUBLIC') return next();

    let authorized = true;

    for (const policy of policies) {
      if (policy === 'USERS') {
        try {
          let token = req.cookies?.access_token;
          if (!token) {
            const authHeader = req.headers?.authorization;
            if (authHeader) {
              const parts = authHeader.split(' ');
              if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) {
                token = parts[1];
              }
            }
          }
          if (!token) { authorized = false; break; }

          const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
          req.userId = payload.sub;

          const sessionToken = req.headers?.['x-session-token'];
          if (sessionToken) {
            const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
            const session = await sessionModel.findOne({ tokenHash }).lean();
            if (!session || session.expiresAt.getTime() < Date.now()) {
              authorized = false;
              break;
            }
          }
        } catch {
          authorized = false;
          break;
        }
      } else if (policy === 'API') {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey || apiKey !== config.APIKEY) {
          authorized = false;
          break;
        }
      }
    }

    if (!authorized) {
      return res.status(403).json({ status: 'Forbidden', message: "You don't have access to this resource" });
    }
    next();
  };

  #handelerMiddleware = (middlewares) => (req, res, next) => {
    if (middlewares.length === 0) return next();
    let index = 0;
    const runNext = (err) => {
      if (err) return next(err);
      if (index >= middlewares.length) return next();
      middlewares[index++](req, res, runNext);
    };
    runNext();
  };
}
