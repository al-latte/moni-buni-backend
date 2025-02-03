import { Request, Response } from 'express';
import Transaction from "../models/transaction";
import Category from "../models/category.model";
import Wallet from "../models/wallet.model";

interface CustomRequest extends Request {
    user?: any;
}

export const addTransaction = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {amount, category, description, transactionType, date, wallet} = req.body;
        const userId = req.user._id;

        const categoryExists = await Category.findOne({ _id: category, userId });
        if (!categoryExists) {
            console.log(`Category not found or unauthorized. Category ID: ${category}, User ID: ${userId}`);
            res.status(404).json({ error: "Category not found or unauthorized" });
            return;
        }

        const walletExists = await Wallet.findOne({ _id: wallet, userId });
        if (!walletExists) {
            console.log(`Wallet not found or unauthorized. Wallet ID: ${wallet}, User ID: ${userId}`);
            res.status(404).json({ error: "Wallet not found or unauthorized" });
            return;
        }

        const newTransaction = new Transaction({
            userId,
            amount,
            category,
            description,
            transactionType,
            date,
            wallet
        });

        if (newTransaction) {
            await newTransaction.save();
            res.status(200).json({
                _id: newTransaction._id,
                userId: newTransaction.userId,
                amount: newTransaction.amount,
                category: newTransaction.category,
                description: newTransaction.description,
                transactionType: newTransaction.transactionType,
                date: newTransaction.date,
                wallet: newTransaction.wallet,
            });
        } else {
            res.status(400).json({error: "Invalid Transaction data"});
        }
    } catch (error) {
        console.log("Error in addTransaction controller", (error as Error).message);
        res.status(500).json({error: "Internal server error"});
    }
};

export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findByIdAndDelete(id);

        if (!transaction) {
            res.status(404).json({ error: "Transaction not found" });
            return;
        }

        res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("Error in deleteTransaction controller", (error as Error).message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const transactions = await Transaction.find({ userId });

        if (!transactions.length) {
            res.status(404).json({ error: "User has no transactions" });
            return;
        }

        res.status(200).json({ transactions });
    } catch (error) {
        console.error("Error in getTransactions controller", (error as Error).message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
  
      const updatedTransaction = await Transaction.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
  
      if (!updatedTransaction) {
        res.status(404).json({ message: 'Transaction not found' });
        return;
      }
  
      res.status(200).json({
        message: 'Transaction updated successfully',
        transaction: updatedTransaction,
      });
    } catch (error) {
        console.error("Error in updateTransaction controller", (error as Error).message);
        res.status(500).json({ error: "Internal server error" });
    }
  };