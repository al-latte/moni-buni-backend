import mongoose from "mongoose";
import { Schema } from "mongoose";

const transactionSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category" 
    },
    description: {
        type: String,
    },
    transactionType: {
        type: String,
        required: true,
        enum: ["expense", "income"]
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet"  
    }

}, {timestamps: true})

const Transaction = mongoose.model("Transaction", transactionSchema)

export default Transaction