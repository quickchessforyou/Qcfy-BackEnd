# Setting Up Pieces3 Folder

## 📁 Required Files

You need to add the following 12 SVG files to `src/assets/pieces3/`:

### White Pieces:
1. `whitepawn.svg`
2. `whiteknight.svg`
3. `whitebishop.svg`
4. `whiterook.svg`
5. `whitequeen.svg`
6. `whiteking.svg`

### Black Pieces:
7. `blackpawn.svg`
8. `blackknight.svg`
9. `blackbishop.svg`
10. `blackrook.svg`
11. `blackqueen.svg`
12. `blackking.svg`

## 📂 Folder Structure

```
src/
└── assets/
    ├── pieces/          (Classic set)
    │   ├── whitepawn.svg
    │   ├── whiteknight.svg
    │   └── ... (10 more files)
    ├── pieces2/         (Modern set)
    │   ├── whitepawn.svg
    │   ├── whiteknight.svg
    │   └── ... (10 more files)
    └── pieces3/         (Elegant set) ← NEW!
        ├── whitepawn.svg
        ├── whiteknight.svg
        └── ... (10 more files)
```

## ✅ What's Already Done

The code is already set up to use pieces3:

1. ✅ ChessBoard imports all pieces from pieces3 folder
2. ✅ ThemeContext includes "elegant" piece set
3. ✅ ThemeModal shows third option with preview
4. ✅ Piece selection logic handles 3 sets

## 🎯 How to Add the Files

### Option 1: Copy from existing set
```bash
# Copy from pieces folder and modify
cp -r src/assets/pieces src/assets/pieces3
# Then replace with your new piece designs
```

### Option 2: Create new folder
```bash
# Create the folder
mkdir src/assets/pieces3

# Add your 12 SVG files
# Make sure file names match exactly:
# - whitepawn.svg, whiteknight.svg, etc.
# - blackpawn.svg, blackknight.svg, etc.
```

## 🎨 File Naming Convention

**IMPORTANT:** File names must match exactly (case-sensitive):

```
✅ Correct:
- whitepawn.svg
- whiteknight.svg
- whitebishop.svg
- whiterook.svg
- whitequeen.svg
- whiteking.svg
- blackpawn.svg
- blackknight.svg
- blackbishop.svg
- blackrook.svg
- blackqueen.svg
- blackking.svg

❌ Wrong:
- WhitePawn.svg (capital letters)
- white_pawn.svg (underscore)
- whitePawn.svg (camelCase)
```

## 🧪 Testing

After adding the files:

1. Start the dev server: `npm run dev`
2. Click ⚙️ settings icon
3. You should see 3 piece options:
   - Classic (pieces folder)
   - Modern (pieces2 folder)
   - Elegant (pieces3 folder) ← NEW!
4. Click "Elegant" to test
5. Board should show pieces from pieces3 folder

## 🐛 Troubleshooting

### If pieces don't show:
1. Check file names match exactly
2. Check files are in correct folder
3. Check files are valid SVG format
4. Clear browser cache and refresh
5. Check browser console for errors

### If preview doesn't show:
- The preview uses `whiteknight.svg`
- Make sure this file exists in pieces3 folder

## 📊 Current Status

```
Piece Sets Available:
├── Classic (default)  ✅ Working
├── Modern             ✅ Working  
└── Elegant            ⏳ Waiting for pieces3 files
```

## 🎨 Design Guidelines

For best results, your pieces3 SVGs should:
- Be square (same width and height)
- Have transparent background
- Be centered in the viewBox
- Use consistent stroke width
- Match the style of other sets

## 🔧 Code References

If you need to modify the implementation:

### ChessBoard.jsx
```javascript
// Lines 19-30: Import pieces3 files
import whitePawn3 from '../../assets/pieces3/whitepawn.svg';
// ...

// Lines 60-72: pieceImageSets.set3 object
set3: {
  'p': blackPawn3,
  // ...
}

// Lines 78-81: Selection logic
const pieceImages = pieceSet === 'modern' 
  ? pieceImageSets.set2 
  : pieceSet === 'elegant'
  ? pieceImageSets.set3
  : pieceImageSets.set1;
```

### ThemeContext.jsx
```javascript
// Lines 48-52: Piece set definition
elegant: {
  name: 'Elegant',
  folder: 'pieces3'
}
```

### ThemeModal.jsx
```javascript
// Line 5: Import preview
import whiteKnight3 from '../../assets/pieces3/whiteknight.svg';

// Lines 60-72: UI for third option
<div className={pieceSet === 'elegant' ? styles.active : ''}>
  <img src={whiteKnight3} alt="Elegant pieces" />
  <span>Elegant</span>
</div>
```

## ✨ Once Complete

After adding pieces3 files, users will be able to:
- Choose from 3 different piece styles
- See preview of each style in settings
- Switch between styles instantly
- Have their preference saved

---

**Status:** Code ready, waiting for pieces3 SVG files
**Last Updated:** December 5, 2025
