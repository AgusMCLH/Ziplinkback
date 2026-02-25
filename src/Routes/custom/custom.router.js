import { Router } from 'express';
import jwt from 'jsonwebtoken';

export default class CustomRouter {
  constructor() {
    this.router = Router();
    this.init();
  }

  init() {}

  getRouter() {
    return this.router;
  }

  get(path, policies, middlewares, ...callback) {
    this.router.get(
      path,
      this.#handlerPolicies(policies),
      this.#handelerMiddleware(middlewares),
      this.#applyCallback(callback),
    );
  }

  post(path, policies, middlewares, ...callback) {
    this.router.post(
      path,
      this.#handlerPolicies(policies),
      this.#handelerMiddleware(middlewares),
      this.#applyCallback(callback),
    );
  }

  put(path, policies, middlewares, ...callback) {
    this.router.put(
      path,
      this.#handlerPolicies(policies),
      this.#handelerMiddleware(middlewares),
      this.#applyCallback(callback),
    );
  }

  delete(path, policies, middlewares, ...callback) {
    this.router.delete(
      path,
      this.#handlerPolicies(policies),
      this.#handelerMiddleware(middlewares),
      this.#applyCallback(callback),
    );
  }

  #applyCallback(callbacks) {
    if (callbacks.length > 1) {
      callbacks = [callbacks[callbacks.length - 1]]; //Si hay mas de un callback, se toma el ultimo
    }
    return callbacks.map((callback) => async (...params) => {
      try {
        await callback.apply(this, params); //Se ejecuta el callback
      } catch (error) {
        console.log(error);
        params[1].status(500).send({ status: 'Internal Server Error', error }); //Si hay un error, se muestra un mensaje de error
      }
    });
  }

  #handlerPolicies = (policies) => (req, res, next) => {
    if (policies[0] === 'PUBLIC') {
      //Si la Policy es PUBLIC, se permite el acceso
      return next();
    }

    try {
      const token = req.cookies?.access_token;

      if (!token) {
        return res.status(401).json({
          errorBool: true,
          errorStatus: 401,
          message: 'Unauthorized',
        });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);

      req.userId = payload.sub;

      return next(); //TODO: Implementar Roles para verificar si el usuario tiene acceso a la ruta, por ahora se permite el acceso a cualquier usuario autenticado
    } catch (err) {
      return res.status(401).json({
        errorBool: true,
        errorStatus: 401,
        message: 'Unauthorized',
      });
    }

    policies.forEach((politic) => {
      if (politic === user.role?.toUpperCase()) {
        req.user = user;
        valid = true;
      } //Se recorre el array de politicas y si el usuario tiene el rol, se permite el acceso
    });

    valid ? next() : console.log("Forbbidden, user doesn't have access"); //Si no tiene el rol, se muestra un mensaje de error

    return;
  };

  #handelerMiddleware = (middlewares) => (req, res, next) => {
    if (middlewares.length === 0) {
      next(); //Si no hay middlewares, se pasa al siguiente
    }
    middlewares.forEach((middleware) => {
      middleware(req, res, next); //Se recorren los middlewares y se ejecutan
    });
  };
}
