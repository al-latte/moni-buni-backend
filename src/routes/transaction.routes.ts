import express from "express"
import { addTransaction, deleteTransaction, updateTransaction, getTransactions } from "../controllers/transaction.controller";
import authenticate from "../middleware/authenticate";

const router = express.Router()

router.post("/add", authenticate, addTransaction)

router.get("/:userId", authenticate, getTransactions)

router.put("/update/:id", authenticate, updateTransaction)

router.delete("/delete/:id", authenticate, deleteTransaction)

export default router