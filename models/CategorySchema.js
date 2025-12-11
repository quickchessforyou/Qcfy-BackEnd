import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: "FaChess"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Admin" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt timestamp before saving
CategorySchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Index for faster queries
CategorySchema.index({ name: 1, isActive: 1 });

const CategoryModel = mongoose.model("Category", CategorySchema);

export default CategoryModel;
