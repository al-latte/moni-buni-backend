import express from "express"
import authenticate from "../middleware/authenticate";
import { addWallet, editWallet, getWallets, deleteWallet } from "../controllers/wallet.controller";

const router = express.Router()

router.post("/add", authenticate, addWallet)

router.put("/update/:id", authenticate, editWallet)

router.get("/:userId", authenticate, getWallets)

router.delete("/delete/:id", authenticate, deleteWallet)

export default router