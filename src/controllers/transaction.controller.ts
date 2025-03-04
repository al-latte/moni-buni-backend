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
      const walletDoc = await Wallet.findOne({ _id: wallet, userId }).session(
        session
      );
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
    // multiplier is used to add or subtract the amount from the wallet balance
    // if expense it will be -1, if income it will be 1. -1 x amount will be a negative number, so when $inc it will be -amount + balance = subtract amount from balance
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
      const activeBudgets = await Budget.find({
        userId,
        isActive: true,
        "categories.categoryId": category,
        startDate: { $lte: date },
        endDate: { $gte: date },
      });

      if (activeBudgets.length > 0) {
        await Budget.updateMany(
          {
            userId,
            isActive: true,
            "categories.categoryId": category,
            startDate: { $lte: date },
            endDate: { $gte: date },
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
      .status(
        error instanceof Error && error.message.includes("Insufficient funds")
          ? 400
          : 500
      )
      .json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
  } finally {
    session.endSession();
  }
};

export const deleteTransaction = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({ _id: id, userId }).session(session);
    if (!transaction) {
      res.status(404).json({ error: "Transaction not found or unauthorized" });
      return;
    }
    
    const multiplier = transaction.transactionType === "expense" ? 1 : -1;
    const updatedWallet = await Wallet.findByIdAndUpdate(
      transaction.wallet,
      { $inc: { balance: multiplier * transaction.amount } },
      { session, new: true }
    );

    if (!updatedWallet) {
      throw new Error("Failed to update wallet balance");
    }

      if (transaction.transactionType === "expense") {
        const activeBudgets = await Budget.find({
          userId,
          isActive: true,
          "categories.categoryId": transaction.category,
          startDate: { $lte: transaction.date },
          endDate: { $gte: transaction.date },
        });
  
        if (activeBudgets.length > 0) {
          await Budget.updateMany(
            {
              userId,
              isActive: true,
              "categories.categoryId": transaction.category,
              startDate: { $lte: transaction.date },
              endDate: { $gte: transaction.date },
            },
            {
              $inc: {
                "categories.$.spent": -transaction.amount,
              },
            },
            { session }
          );
        }
    }

    await Transaction.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.log("Error in deleteTransaction controller", (error as Error).message);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  } finally {
    session.endSession();
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
  req: CustomRequest,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { amount, category, description, transactionType, date, wallet } = req.body;
    const userId = req.user._id;

    // Find the transaction
    const transactionExists = await Transaction.findOne({
      _id: id,
      userId,
    }).session(session);
    
    if (!transactionExists) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    // Check if category exists if it's being changed
    if (category && category !== transactionExists.category) {
      const categoryExists = await Category.findOne({
        _id: category,
        userId,
      }).session(session);
      
      if (!categoryExists) {
        res.status(404).json({ error: "Category not found or unauthorized" });
        return;
      }
    }

    // Extract transaction data
    const oldType = transactionExists.transactionType;
    const oldAmount = transactionExists.amount;
    const oldWalletId = transactionExists.wallet;
    const newWalletId = wallet || oldWalletId;
    
    // Calculate multipliers
    const oldMultiplier = oldType === "expense" ? -1 : 1;
    const newMultiplier = transactionType === "expense" ? -1 : 1;

    // Verify wallet exists (whether it's changing or not)
    const targetWallet = await Wallet.findOne({
      _id: newWalletId,
      userId,
    }).session(session);

    if (!targetWallet) {
      res.status(404).json({ error: "Wallet not found or unauthorized" });
      return;
    }

    await Wallet.findByIdAndUpdate(
      oldWalletId,
      { $inc: { balance: -oldAmount * oldMultiplier } },
      { session }
    );

    if (wallet && wallet === transactionExists.wallet) {
      if (transactionType === "expense" && targetWallet.balance < amount) {
        throw new Error("Insufficient funds in wallet");
      }
    }

    await Wallet.findByIdAndUpdate(
      newWalletId,
      { $inc: { balance: amount * newMultiplier } },
      { session }
    );


    if (transactionExists.transactionType === "expense") {
      const oldCategory = transactionExists.category;
      const oldDate = transactionExists.date;
      
      const oldBudgets = await Budget.find({
        userId,
        isActive: true,
        "categories.categoryId": oldCategory,
        startDate: { $lte: oldDate },
        endDate: { $gte: oldDate },
      }).session(session);
    
      // Update each affected budget
      for (const budget of oldBudgets) {
        await Budget.updateOne(
          {
            _id: budget._id,
            "categories.categoryId": oldCategory,
          },
          {
            $inc: { "categories.$.spent": -oldAmount },
          },
          { session }
        );
      }
    }

    if (transactionType === "expense") {
      const newCategory = category || transactionExists.category;
      const newDate = date || transactionExists.date;
      
      const newBudgets = await Budget.find({
        userId,
        isActive: true,
        "categories.categoryId": newCategory,
        startDate: { $lte: newDate },
        endDate: { $gte: newDate },
      }).session(session);
    
      // Update each affected budget
      for (const budget of newBudgets) {
        await Budget.updateOne(
          {
            _id: budget._id,
            "categories.categoryId": newCategory,
          },
          {
            $inc: { "categories.$.spent": amount },
          },
          { session }
        );
      }
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      { amount, category, description, transactionType, date, wallet: newWalletId },
      { new: true, session }
    );

    await session.commitTransaction();
    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(
      "Error in updateTransaction controller",
      (error as Error).message
    );
    res
      .status(
        error instanceof Error && error.message.includes("Insufficient funds")
          ? 400
          : 500
      )
      .json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
  } finally {
    session.endSession();
  }
};
