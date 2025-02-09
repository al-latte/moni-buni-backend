import express from "express"
import authenticate from "../middleware/authenticate";
import { addCategory, deleteCategory, getCategories, updateCategory } from "../controllers/category.controller";

const router = express.Router();

router.post("/add", authenticate, addCategory)

router.get("/:userId", authenticate, getCategories)

router.delete("/delete/:id", authenticate, deleteCategory )

router.put("/update/:id", authenticate, updateCategory )

export default router