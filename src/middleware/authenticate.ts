import jwt from "jsonwebtoken";
import { Request, Response, NextFunction, RequestHandler } from "express";
import User from "../models/user.model";

declare global {
  namespace Express {
    export interface Request {
      user?: {
        _id: string;
        email: string;
      };
    }
  }
}

const asyncWrapper = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

const authenticate: RequestHandler = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Authorization token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { userId: string };

    if(!decoded) {
      res.status(401).json({ error: 'Unauthorized - Invalid Token' });
      return;
    }

    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.user = { _id: user._id.toString(), email: user.email };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Request is not authorized' });
    return;
  }
})

export default authenticate;