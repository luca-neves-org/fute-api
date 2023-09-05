import { NextFunction, Request, Response } from 'express';
import { compare } from 'bcryptjs';

import {
  FootyRepository,
  TokenRepository,
  clearCookies,
  setCookie,
} from '@repositories/index';

class LoginController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      const user = await FootyRepository.findByUsername(username);

      if (!user) {
        return next({
          status: 400,
          message: 'Invalid credentials.',
        });
      }

      const checkPassword = await compare(password, user.password);

      if (!checkPassword) {
        return next({
          status: 400,
          message: 'Invalid credentials.',
        });
      }

      const tokenRepository = new TokenRepository();
      const accessToken = tokenRepository.generateAccessToken(user.id, '60s');
      const refreshToken = tokenRepository.generateRefreshToken(user.id, '5d');

      setCookie(res, 'refresh_token', refreshToken);

      const { password: _, ...loggedUser } = user;

      res.locals = {
        status: 200,
        message: 'User logged',
        data: {
          loggedUser,
          accessToken,
        },
      };

      return next();
    } catch (error) {
      return next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refresh_token;

      console.log(refreshToken);

      if (!refreshToken) {
        delete req.headers.authorization;

        return next({
          status: 401,
          message: 'Invalid token',
        });
      }

      const tokenRepository = new TokenRepository();
      const decodedRefreshToken =
        tokenRepository.verifyRefreshToken(refreshToken);

      if (!decodedRefreshToken) {
        delete req.headers.authorization;

        return next({
          status: 401,
          message: 'Invalid token',
        });
      }

      const user = await FootyRepository.findById(decodedRefreshToken.id);

      if (!user) {
        return next({
          status: 400,
          message: 'User not found',
        });
      }

      clearCookies(res, 'refresh_token');

      const newRefreshToken = tokenRepository.generateRefreshToken(
        user.id,
        '1d',
      );
      const acessToken = tokenRepository.generateAccessToken(user.id, '30s');

      setCookie(res, 'refresh_token', newRefreshToken);

      const { password: _, ...loggedUser } = user;

      res.locals = {
        status: 200,
        message: 'Token refreshed',
        data: {
          loggedUser,
          acessToken,
        },
      };

      return next();
    } catch (error) {
      return next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      clearCookies(res, 'refresh_token');
      delete req.headers.authorization;

      res.locals = {
        status: 200,
        message: 'User logged out',
      };

      return next();
    } catch (error) {
      return next(error);
    }
  }
}

export default new LoginController();
