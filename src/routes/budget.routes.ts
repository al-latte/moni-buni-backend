import express from "express";
import {
  createBudget,
  getUserBudgets,
  updateBudget,
  deleteBudget,
} from "../controllers/budget.controller";
import authenticate from "../middleware/authenticate";

const router = express.Router();

router.post("/add", authenticate, createBudget);

router.get("/:userId", authenticate, getUserBudgets);

router.delete("/delete/:id", authenticate, deleteBudget);

router.put("/update/:id", authenticate, updateBudget);

export default router;
