import express from "express"
import authenticate from "../middleware/authenticate";
import { addCategory, deleteCategory, getCategories } from "../controllers/category.controller";

const router = express.Router();

router.post("/add", authenticate, addCategory)

router.get("/:userId", authenticate, getCategories)

router.delete("/delete/:id", authenticate, deleteCategory )

export default router