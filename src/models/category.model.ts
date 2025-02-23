import mongoose from "mongoose";
import { Schema } from "mongoose";

const categorySchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    icon: {
        type: String,
    },
    title: {
        type: String,
        required: true,
        unique: true
    },

}, {timestamps: true})

const Category = mongoose.model("Category", categorySchema)

export default Category