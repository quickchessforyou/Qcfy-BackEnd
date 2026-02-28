# Quick Start: Category & Puzzle Management

## 🚀 Getting Started

### 1. Start the Backend

```bash
cd Chess-Backend
npm run dev
```

### 2. Seed Default Categories (Optional but Recommended)

```bash
cd Chess-Backend
npm run seed:categories
```

This creates 5 default categories:
- ✅ Tactical Puzzles
- ✅ Endgame Studies
- ✅ Opening Traps
- ✅ Middlegame Strategy
- ✅ Checkmate Patterns

### 3. Start the Frontend

```bash
cd Chess-Frontend
npm run dev
```

### 4. Login to Admin Panel

1. Navigate to `http://localhost:5173/admin/login`
2. Login with your admin credentials
3. You'll be redirected to the admin dashboard

## 📋 Proper Flow

### Option A: Using Seeded Categories

If you ran the seed script:

1. **Go to Puzzles → Create Puzzle**
2. Select a category from the dropdown
3. Fill in puzzle details
4. Save

### Option B: Creating Categories Manually

If you didn't seed:

1. **Go to Categories** (Admin Panel → Categories)
2. Click "Add Category"
3. Fill in:
   - Name: `tactics` (lowercase, no spaces)
   - Title: `Tactical Puzzles`
   - Description: `Sharpen your tactical vision`
4. Click "Create"
5. Repeat for other categories you need

6. **Go to Puzzles → Create Puzzle**
7. Now you'll see your categories in the dropdown
8. Select category and create puzzle

## 🎯 Key Points

### ⚠️ Important Rules

1. **Categories must exist before creating puzzles**
2. **Category name cannot be changed after creation**
3. **Cannot delete categories that have puzzles**
4. **Category is required for all puzzles**

### ✅ Best Practices

1. Create all your categories first
2. Use consistent naming (lowercase, no spaces for name field)
3. Use descriptive titles for display
4. Plan your category structure before starting

## 🔄 Workflow Example

```
Step 1: Create Categories
├── Tactics
├── Endgame
└── Opening

Step 2: Create Puzzles
├── Puzzle 1 → Category: Tactics
├── Puzzle 2 → Category: Endgame
└── Puzzle 3 → Category: Tactics

Step 3: Manage
├── Edit puzzles (can change category)
├── Edit categories (title, description)
└── Delete (only empty categories)
```

## 🛠️ API Testing

### Test Category Creation

```bash
curl -X POST http://localhost:4000/api/category/create-category \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "tactics",
    "title": "Tactical Puzzles",
    "description": "Sharpen your tactical vision",
    "icon": "FaChess"
  }'
```

### Test Get Categories

```bash
curl http://localhost:4000/api/category/get-categories
```

### Test Puzzle Creation with Category

```bash
curl -X POST http://localhost:4000/api/puzzle/create-puzzle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Fork the King and Queen",
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    "difficulty": "medium",
    "category": "tactics",
    "solutionMoves": ["Ng5", "d5"],
    "description": "Find the winning tactical blow"
  }'
```

## 🐛 Troubleshooting

### Problem: "No categories available" when creating puzzle

**Solution:**
1. Go to Categories page
2. Create at least one category
3. Or run `npm run seed:categories` in backend

### Problem: Cannot create category - "already exists"

**Solution:**
- Category names must be unique
- Try a different name
- Or check if it already exists in the list

### Problem: Cannot delete category

**Solution:**
- Category has puzzles assigned to it
- Go to Puzzles page
- Reassign or delete those puzzles first
- Then delete the category

### Problem: Category dropdown not loading

**Solution:**
1. Check backend is running
2. Check browser console for errors
3. Verify admin token is valid
4. Try refreshing the page

## 📱 UI Navigation

```
Admin Panel
├── Dashboard
├── Categories ← Start here!
│   ├── View all categories
│   ├── Create new category
│   ├── Edit category
│   └── Delete category
├── Puzzles
│   ├── View all puzzles
│   ├── Create puzzle ← Requires categories!
│   ├── Edit puzzle
│   └── Delete puzzle
└── ...
```

## 🎨 Screenshots Guide

### 1. Categories Page
- Grid of category cards
- Each shows title, description, puzzle count
- Edit and delete buttons on each card
- "Add Category" button at top

### 2. Create Category Modal
- Name field (unique ID)
- Title field (display name)
- Description textarea
- Icon field (optional)
- Cancel and Create buttons

### 3. Create Puzzle Page
- Category dropdown (populated from database)
- If no categories: warning message + link to categories
- All other puzzle fields
- Live chess board preview

## 📚 Related Documentation

- Full flow documentation: `CATEGORY_PUZZLE_FLOW.md`
- Admin theme guide: `ADMIN_THEME_GUIDE.md`
- Backend integration: `BACKEND_INTEGRATION.md`

## 🎉 Success Checklist

- [ ] Backend running
- [ ] Categories seeded or created manually
- [ ] Can view categories in admin panel
- [ ] Can create new category
- [ ] Can edit existing category
- [ ] Category dropdown shows in puzzle creation
- [ ] Can create puzzle with category
- [ ] Can edit puzzle and change category
- [ ] Puzzle count updates on category cards

## 💡 Tips

1. **Start with seed script** - Fastest way to get started
2. **Plan categories** - Think about your puzzle organization
3. **Use consistent naming** - Makes management easier
4. **Test the flow** - Create one category and one puzzle first
5. **Check the docs** - Refer to CATEGORY_PUZZLE_FLOW.md for details
