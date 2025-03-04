import mongoose, { Schema } from "mongoose";

interface ICategory {
  categoryId: mongoose.Types.ObjectId;
  limit: number;
  spent: number;
}

interface IBudget extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  categories: ICategory[];
  isActive: boolean;
  remainingAmount: number; // Virtual
  totalSpent: number; // Virtual
  updateCategorySpent(
    categoryId: mongoose.Types.ObjectId,
    amount: number
  ): Promise<void>;
  categoryOverBudget(categoryId: mongoose.Types.ObjectId): boolean;
}

interface IBudgetModel extends mongoose.Model<IBudget> {
  findActiveUserBudget(
    userId: mongoose.Types.ObjectId
  ): Promise<IBudget | null>;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: any, startDate: Date): boolean {
          return startDate <= this.endDate;
        },
        message: "Start date must be before or equal to end date",
      },
    },
    endDate: {
      type: Date,
      required: true,
    },
    categories: [
      {
        categoryId: {
          type: Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        limit: {
          type: Number,
          required: true,
          min: 0,
        },
        spent: {
          type: Number,
          default: 0,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
   }
);

// Add virtual for remaining amount
budgetSchema.virtual("remainingAmount").get(function (this: IBudget) {
  const totalSpent = this.categories.reduce((sum, cat) => sum + cat.spent, 0);
  return this.totalAmount - totalSpent;
});

// Add virtual for total spent
budgetSchema.virtual("totalSpent").get(function (this: IBudget) {
  return this.categories.reduce((sum, cat) => sum + cat.spent, 0);
});

// Check if category is over budget
budgetSchema
  .virtual("categoryOverBudget")
  .get(function (this: IBudget, categoryId: mongoose.Types.ObjectId) {
    const category = this.categories.find((c) =>
      c.categoryId.equals(categoryId)
    );
    return category ? category.spent > category.limit : false;
  });

// Update spent amount for a category
budgetSchema.methods.updateCategorySpent = async function (
  this: IBudget,
  categoryId: mongoose.Types.ObjectId,
  amount: number
) {
  const category = this.categories.find((c) => c.categoryId.equals(categoryId));
  if (category) {
    category.spent += amount;
    await this.save();
  }
};

// Add validation for total allocated amount
budgetSchema.pre("save", function (this: IBudget, next) {
  const totalAllocated = this.categories.reduce(
    (sum, cat) => sum + cat.limit,
    0
  );
  if (totalAllocated > this.totalAmount) {
    next(new Error("Total allocated amount cannot exceed budget total amount"));
  }
  next();
});

budgetSchema.static(
  "findActiveUserBudget",
  async function (
    this: mongoose.Model<IBudget>,
    userId: mongoose.Types.ObjectId
  ): Promise<IBudget | null> {
    return this.findOne({
      userId,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).populate("categories.categoryId");
  }
);

interface ITransaction {
  userId: mongoose.Types.ObjectId;
  transactionType: string;
  category: mongoose.Types.ObjectId;
  amount: number;
}

const Transaction = mongoose.model("Transaction");

Transaction.schema.post("save", async function (doc: ITransaction) {
  if (doc.transactionType === "expense") {
    const budget = await Budget.findActiveUserBudget(doc.userId);
    if (budget) {
      await budget.updateCategorySpent(doc.category, doc.amount);
    }
  }
});

const Budget = mongoose.model<IBudget, IBudgetModel>("Budget", budgetSchema);

export default Budget;
