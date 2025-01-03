import express from "express"
import { addTransaction, deleteTransaction, getTransactions } from "../controllers/transaction.controller";
import authenticate from "../middleware/authenticate";

const router = express.Router()

router.post("/add", authenticate, addTransaction)

router.get("/:userId", authenticate, getTransactions)

router.delete("/delete/:id", authenticate, deleteTransaction)

export default router