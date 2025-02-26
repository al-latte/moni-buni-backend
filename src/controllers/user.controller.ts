import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";

interface CustomRequest extends Request {
    user?: any;
  }

export const updateUser = async (
    req: CustomRequest,
    res: Response
  ): Promise<void> => {
  try {
    const { fullname, password } = req.body;
    const userId = req.user?._id;
    if (!userId){
         res.status(401).json({ error: "Unauthorized" });
         return;
        }

    const updateData: any = { fullname };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser){ 
        res.status(404).json({ error: "User not found" })
        return;
    }
    res.status(200).json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};