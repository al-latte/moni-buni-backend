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

const generateTokenAndeSetCookie = (userId: string, res: Response): string => {
    const token = jwt.sign(
        { userId } as TokenPayload, 
        process.env.JWT_SECRET_KEY!, 
        { expiresIn: "15d" }
    );

    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
        httpOnly: true, // Prevent XSS attacks
        sameSite: "strict", // Prevent CSRF attacks
        secure: process.env.NODE_ENV !== "development" // Use secure in production
    } as CookieOptions);

    return token;
}

export default generateTokenAndeSetCookie;