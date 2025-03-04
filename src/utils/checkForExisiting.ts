import Transaction from "../models/transaction.model";
import Category from "../models/category.model";
import Budget from "../models/budget.model";
import Wallet from "../models/wallet.model";

export const checkExisting = {
    checkExistingCategory: async (categoryId: string, userId: string) => {
        return await Category.findOne({_id: categoryId, userId});
    },

    checkExistingWallet: async (walletId: string, userId: string) => {
        return await Wallet.findOne({_id: walletId, userId})
    },

    checkExixtingBudget: async (BudgetId: string, userId: string) => {
        return await Budget.findOne({_id: BudgetId, userId})
    },
    
    checkExistingTransaction: async (transactionId: string, userId: string) => {
        return await Transaction.findOne({_id: transactionId, userId})
    }
}