import mongoose from "mongoose";
import { Schema } from "mongoose";

interface ICategory extends Document {
    userId: mongoose.Types.ObjectId;
    icon: string;
    title: string;
  }

const categorySchema: Schema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    icon: {
        type: String,
    },
    title: {
        type: String,
        required: true,
    },

}, {timestamps: true})

//a compound index that includes both title and userId, multiple users can have categories with the same name, but an individual user can't have duplicate category names
categorySchema.index({ userId: 1, title: 1 }, { unique: true });

const Category = mongoose.model<ICategory>("Category", categorySchema);

export default Category