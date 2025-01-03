import jwt from "jsonwebtoken"
import { Response } from 'express'

interface TokenPayload {
    userId: string;
}

interface CookieOptions {
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'strict';
    secure: boolean;
}

const generateTokenAndeSetCookie = (userId: string, res: Response): void => {
    const token = jwt.sign({ userId } as TokenPayload, process.env.JWT_SECRET_KEY!, {
        expiresIn: "15d"
    });

    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, //Milliseconds
        httpOnly: true, //prevent XSS attacks (cross-site scripting)
        sameSite: "strict", //To prevent CSRF attacks (cross-site request forgery attacks)
        secure: process.env.NODE_ENV !== "development"
    } as CookieOptions);
}

export default generateTokenAndeSetCookie