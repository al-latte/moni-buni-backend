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

const authenticate: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Authorization token required' });
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return next();
    }

    req.user = { _id: user._id.toString(), email: user.email };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Request is not authorized' });
    return next();
  }
};

export default authenticate;