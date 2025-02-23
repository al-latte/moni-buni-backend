import { Request, Response } from "express";
import Budget from "../models/budget.model";

interface CustomRequest extends Request {
  user?: any;
}

export const createBudget = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, totalAmount, startDate, endDate, categories } = req.body;
    const userId = req.user?._id;

    const budget = await Budget.findOne({ name, userId });

    if (budget) {
      res.status(400).json({ error: "Budget with this name already exists" });
      return;
    }

    const newBudget = new Budget({
      userId,
      name,
      totalAmount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      categories: categories.map((cat: { categoryId: any; limit: Number }) => ({
        categoryId: cat.categoryId,
        limit: cat.limit,
        spent: 0,
      })),
    });

    if (newBudget) {
      await newBudget.save();
      res.status(200).json(newBudget);
    } else {
      res.status(400).json({ error: "Invalid budget data" });
    }
  } catch (error) {
    console.log("Error in createBudget controller", (error as Error).message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserBudgets = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Update all expired budgets to set isActive to false.
    await Budget.updateMany(
      { userId, endDate: { $lt: new Date() }, isActive: true },
      { isActive: false }
    );

    const budgets = await Budget.find({ userId })
      .populate({
        path: "categories.categoryId",
        select: "title icon _id",
      })
      .sort({ createdAt: -1 });

    if (!budgets.length) {
      res.status(404).json({ error: "User has no budgets" });
      return;
    }

    res.status(200).json({ budgets });
  } catch (error) {
    console.error(
      "Error in getUserBudgets controller",
      (error as Error).message
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateBudget = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const startDate = updateData.startDate
      ? new Date(updateData.startDate)
      : undefined;
    const endDate = updateData.endDate
      ? new Date(updateData.endDate)
      : undefined;

    if (startDate) {
      startDate.setUTCHours(0, 0, 0, 0);
    }
    if (endDate) {
      endDate.setUTCHours(0, 0, 0, 0);
    }

    // Add debug log
    console.log("Normalized dates:", {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });

    if (startDate && endDate && startDate > endDate) {
      res.status(400).json({
        error: "Start date must be before or equal to end date",
      });
      return;
    }

    const budget = await Budget.findById(id);

    if (!budget) {
      res.status(404).json({ error: "Budget not found" });
      return;
    }

    // Handle category updates
    if (updateData.categories) {
      updateData.categories = updateData.categories.map(
        (cat: { categoryId: any; limit: Number; spent: Number }) => ({
          categoryId: cat.categoryId,
          limit: cat.limit,
          spent: cat.spent || 0,
        })
      );
    }

    // Update fields on the document
    budget.name = updateData.name;
    budget.totalAmount = updateData.totalAmount;
    budget.startDate = startDate!;
    budget.endDate = endDate!;
    budget.categories = updateData.categories;
    budget.isActive = updateData.isActive;

    const updatedBudget = await budget.save();
    await updatedBudget.populate("categories.categoryId");
    res.status(200).json(updatedBudget);
  } catch (error) {
    console.error("Error in updateBudget controller", (error as Error).message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteBudget = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const budget = await Budget.findByIdAndDelete(id);

    if (!budget) {
      res.status(404).json({ error: "Budget not found" });
      return;
    }

    res.status(200).json({ message: "Budget archived successfully" });
  } catch (error) {
    console.error("Error in deleteBudget controller", (error as Error).message);
    res.status(500).json({ error: "Internal server error" });
  }
};
