import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import User from "../models/user.model";
import generateTokenAndeSetCookie from "../utils/generateToken";

export const signupUser = async (req: Request, res: Response) => {
  try {
    const { fullname, email, password, confirmPassword } = req.body;

    // check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const user = await User.findOne({ email });

    // check if email is taken
    if (user) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash Password Here
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      await newUser.save();
      generateTokenAndeSetCookie(newUser._id.toString(), res);

      res.status(201).json({
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
      });
    } else {
      return res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", (error as Error).message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    generateTokenAndeSetCookie(user._id.toString(), res);

    res.status(200).json({
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
      },
      message: "Login successful"
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logoutUser = (req: Request, res: Response) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", (error as Error).message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
