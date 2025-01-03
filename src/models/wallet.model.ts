import mongoose from "mongoose";
import { Schema } from "mongoose";

const walletSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    description: {
        type: String,
    },
    setAsDefault: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const Wallet = mongoose.model("Wallet", walletSchema)

export default Wallet