import Wallet from "../models/wallet.model"
import { Request, Response } from 'express';

export const addWallet = async (req: Request, res: Response) => {
    try {
        const {title, balance, description, setAsDefault} = req.body
        const userId = req.user!._id

        const wallet = await Wallet.findOne({title, userId})

        if(wallet) {
            res.status(400).json({error: "Wallet already exists"})
            return;
        }

        const newWallet = new Wallet({
            userId,
            title,
            balance,
            description,
            setAsDefault
          });

        if(newWallet) {
            await newWallet.save();

            res.status(200).json({
                _id: newWallet._id,
                userId: newWallet.userId,
                title: newWallet.title,
                balance: newWallet.balance,
                description: newWallet.description,
                setAsDefault: newWallet.setAsDefault,
            })
        } else {
            res.status(400).json({error: "Invalid wallet data"})
        }

    } catch (error) {
        console.log("Error in addWallet controller", (error as Error).message)
        res.status(500).json({error: "Internal server error"})
    }
}

export const editWallet = async (req: Request, res: Response) => {
    try {
        const {title, balance, description, setAsDefault} = req.body
        const userId = req.user!._id
        const {id} = req.params

        const wallet = await Wallet.findById(id)

        if(!wallet) {
            res.status(404).json({ error: "Wallet not found" });
            return;
        }

        if(wallet.userId?.toString() !== userId) {
            res.status(403).json({ error: "Not authorized to update this wallet" });
            return;
        }

        const result = await Wallet.findByIdAndUpdate(
            id,
            { title, balance, description, setAsDefault },
            { new: true }
        )

        if (!result) {
            res.status(404).json({ error: "Failed to update wallet" });
            return;
        }

        res.status(200).json({
            _id: result._id,
            userId: result.userId,
            title: result.title,
            balance: result.balance,
            description: result.description,
            setAsDefault: result.setAsDefault,
        })

    } catch (error) {
        console.log("Error in editWallet controller", (error as Error).message)
        res.status(500).json({error: "Internal server error"})
    }
}

export const deleteWallet = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        const wallet = await Wallet.findById(id);

        if (!wallet) {
            res.status(404).json({ error: "Wallet not found" });
            return;
        }

        if(wallet.userId?.toString() !== userId) {
            res.status(403).json({ error: "Not authorized to delete this wallet" });
            return;
        }

        await wallet.deleteOne();
        res.status(200).json({ message: "Wallet deleted successfully" });

    } catch (error) {
        console.error("Error in deleteWallet controller", (error as Error).message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getWallets = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const wallets = await Wallet.find({ userId });

        if (!wallets.length) {
            res.status(404).json({ error: "User has no wallets" });
            return;
        }

        res.status(200).json({ wallets });

    } catch (error) {
        console.error("Error in getwallets controller", (error as Error).message);
        res.status(500).json({ error: "Internal server error" });
    }
};
