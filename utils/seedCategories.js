import CategoryModel from "../models/CategorySchema.js";
import connectDB from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const defaultCategories = [
  {
    name: "tactics",
    title: "Tactical Puzzles",
    description: "Sharpen your tactical vision with combinations, forks, pins, and skewers",
    icon: "FaChess"
  },
  {
    name: "endgame",
    title: "Endgame Studies",
    description: "Master endgame techniques and winning positions",
    icon: "FaTrophy"
  },
  {
    name: "opening",
    title: "Opening Traps",
    description: "Learn common opening traps and theory",
    icon: "FaFlagCheckered"
  },
  {
    name: "middlegame",
    title: "Middlegame Strategy",
    description: "Develop your strategic understanding and planning",
    icon: "FaBrain"
  },
  {
    name: "checkmate",
    title: "Checkmate Patterns",
    description: "Practice common checkmate patterns and techniques",
    icon: "FaCrown"
  }
];

const seedCategories = async () => {
  try {
    await connectDB();
    
    console.log("🌱 Seeding categories...");
    
    // Check if categories already exist
    const existingCount = await CategoryModel.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} categories already exist. Skipping seed.`);
      console.log("   To reseed, delete existing categories first.");
      process.exit(0);
    }
    
    // Insert default categories
    const result = await CategoryModel.insertMany(defaultCategories);
    
    console.log(`✅ Successfully seeded ${result.length} categories:`);
    result.forEach(cat => {
      console.log(`   - ${cat.title} (${cat.name})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  }
};

seedCategories();
