import express from "express";
import { updateUser } from "../controllers/user.controller";
import authenticate from "../middleware/authenticate";

const router = express.Router();

router.put("/update/:id", authenticate, updateUser);

export default router;
