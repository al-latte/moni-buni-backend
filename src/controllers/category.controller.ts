import Category from "../models/category.model";
import { Request, Response } from "express";

interface CustomRequest extends Request {
  user?: any;
}

export const addCategory = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { icon, title } = req.body;
    const userId = req.user?._id;

    const category = await Category.findOne({ title });

    if (category) {
      res.status(400).json({ error: "Category already exists" });
      return;
    }

    const newCategory = new Category({
      userId,
      icon,
      title,
    });

    if (newCategory) {
      await newCategory.save();

      res.status(200).json({
        _id: newCategory._id,
        userId: newCategory.userId,
        icon: newCategory.icon,
        title: newCategory.title,
      });
    } else {
      res.status(400).json({ error: "Invalid category data" });
    }
  } catch (error) {
    console.log("Error in addCategory controller", (error as Error).message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      res.status(404).json({ error: "category not found" });
      return;
    }

    res.status(200).json({ message: "category deleted successfully" });
  } catch (error) {
    console.error(
      "Error in deleteCategory controller",
      (error as Error).message
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const categories = await Category.find({ userId });

    if (!categories.length) {
      res.status(404).json({ error: "User has no categories" });
      return;
    }

    res.status(200).json({ categories });
  } catch (error) {
    console.error(
      "Error in getCategories controller",
      (error as Error).message
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { icon, title } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    // Check if new title already exists for another category
    const existingCategory = await Category.findOne({
      title,
      _id: { $ne: id }, // exclude current category from check
    });

    if (existingCategory) {
      res
        .status(400)
        .json({ error: "Category with this title already exists" });
      return;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { icon, title },
      { new: true } // return updated document
    );

    if (!updatedCategory) {
      res.status(400).json({ error: "Failed to update category" });
      return;
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error(
      "Error in updateCategory controller",
      (error as Error).message
    );
    res.status(500).json({ error: "Internal server error" });
  }
};
