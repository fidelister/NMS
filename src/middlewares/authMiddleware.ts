import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthRequest extends Request {
  user?: JwtPayload | string | any; // attach user info from token
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, token missing' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded; // e.g. { id: 1, role: 'admin', iat: ..., exp: ... }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admins only.' });
    return;
  }
  next();
};

export const teacherOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'teacher') {
    res.status(403).json({ message: 'Access denied. Teacher only.' });
    return;
  }
  next();
};
