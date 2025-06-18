import { Request, Response, NextFunction } from "express";


const noOpMiddleware = (req: Request, res: Response, next: NextFunction) => {
  next();
};


export const generalLimiter = noOpMiddleware;


export const authLimiter = noOpMiddleware;


export const passwordResetLimiter = noOpMiddleware;


export const applicationLimiter = noOpMiddleware;


export const paymentLimiter = noOpMiddleware;
