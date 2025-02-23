import { Request, Response } from "express";
import Transaction from "../models/transaction.model";
import Category from "../models/category.model";
import Wallet from "../models/wallet.model";
import mongoose from "mongoose";
import Budget from "../models/budget.model";

interface CustomRequest extends Request {
  user?: any;
}

export const addTransaction = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, category, description, transactionType, date, wallet } =
      req.body;
    const userId = req.user._id;

    const categoryExists = await Category.findOne({ _id: category, userId });
    if (!categoryExists) {
      console.log(
        `Category not found or unauthorized. Category ID: ${category}, User ID: ${userId}`
      );
      res.status(404).json({ error: "Category not found or unauthorized" });
      return;
    }

    const walletExists = await Wallet.findOne({ _id: wallet, userId });
    if (!walletExists) {
      console.log(
        `Wallet not found or unauthorized. Wallet ID: ${wallet}, User ID: ${userId}`
      );
      res.status(404).json({ error: "Wallet not found or unauthorized" });
      return;
    }

    // Validate wallet and check balance for expenses
    if (wallet && transactionType === "expense") {
      const walletDoc = await Wallet.findOne({ _id: wallet, userId }).session(session);
      if (!walletDoc) {
        throw new Error("Wallet not found or unauthorized");
      }
      if (walletDoc.balance < amount) {
        throw new Error("Insufficient funds in wallet");
      }
    }

    const newTransaction = new Transaction({
      userId,
      amount,
      category,
      description,
      transactionType,
      date,
      wallet,
    });

    await newTransaction.save({ session });

     // Update wallet balance using the session
     const multiplier = transactionType === "expense" ? -1 : 1;
     const updatedWallet = await Wallet.findByIdAndUpdate(
       wallet,
       { $inc: { balance: multiplier * amount } },
       { session, new: true } // Add new: true to get the updated document
     );
 
     if (!updatedWallet) {
       throw new Error("Failed to update wallet balance");
     }

    // Update budget category if it's an expense
    if (transactionType === "expense") {
      const activeBudget = await Budget.findOne({
        userId,
        isActive: true,
        "categories.categoryId": category,
        startDate: { $lte: date },
        endDate: { $gte: date },
      });

      if (activeBudget) {
        await Budget.findOneAndUpdate(
          {
            _id: activeBudget._id,
            "categories.categoryId": category,
          },
          {
            $inc: {
              "categories.$.spent": amount,
            },
          },
          { session }
        );
      }
    }

    await session.commitTransaction();
    res.status(200).json(newTransaction);
  } catch (error) {
    await session.abortTransaction();
    console.log("Error in addTransaction controller", (error as Error).message);
    res
      .status(error instanceof Error && error.message.includes("Insufficient funds") ? 400 : 500)
      .json({ error: error instanceof Error ? error.message : "Internal server error" });
  } finally {
    session.endSession();
  }
};

export const deleteTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByIdAndDelete(id);

    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error(
      "Error in deleteTransaction controller",
      (error as Error).message
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const transactions = await Transaction.find({ userId });

    if (!transactions.length) {
      res.status(404).json({ error: "User has no transactions" });
      return;
    }

    res.status(200).json({ transactions });
  } catch (error) {
    console.error(
      "Error in getTransactions controller",
      (error as Error).message
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedTransaction) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }

    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error(
      "Error in updateTransaction controller",
      (error as Error).message
    );
    res.status(500).json({ error: "Internal server error" });
  }
};
