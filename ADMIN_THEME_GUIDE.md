# Admin Panel Theme Guide

## Color Palette

The admin panel uses a **light gold theme** with the following color scheme:

### Primary Colors
- **Primary Gold**: `#d2b561` - Main brand color for buttons, highlights, and accents
- **Primary Dark**: `#b58863` - Hover states and darker accents
- **Primary Darker**: `#8b7332` - Text on light backgrounds, borders
- **Primary Light**: `#e5d9a8` - Light backgrounds, subtle highlights
- **Primary Lighter**: `#ffd9d9` - Very light backgrounds, table headers

### Background Colors
- **Main Background**: `#faf8f3` - Light warm background for content area
- **Card Background**: `#ffffff` - White for cards and containers
- **Sidebar**: `#b58863` - Gold sidebar with darker shade

### Text Colors
- **Primary Text**: `#2d2416` - Dark brown for main text
- **Secondary Text**: `#666` - Gray for secondary text
- **Border**: `#e8e3d5` - Light borders

### Semantic Colors (Keep as is)
- **Success**: `#2e7d32` / `#e8f5e9` (background)
- **Error/Danger**: `#c62828` / `#ffebee` (background)
- **Warning**: `#8b7332` / `#ffd9d9` (background)
- **Info**: `#1565c0` / `#e3f2fd` (background)

## Design Principles

### 1. Light Theme
- The admin panel uses a **light theme** (not dark)
- Clean, professional appearance with warm gold tones
- High contrast for readability

### 2. Minimal Gradients
- **Avoid gradients** where possible
- Use solid colors: `#d2b561` instead of gradients
- Only use gradients for special decorative elements if absolutely necessary

### 3. Consistent Spacing
- Card padding: `25px` - `30px`
- Section margins: `30px` bottom
- Gap between elements: `15px` - `25px`

### 4. Border Radius
- Cards: `12px`
- Buttons: `8px`
- Badges: `20px` (pill shape)
- Inputs: `8px`

### 5. Shadows
- Cards: `0 2px 10px rgba(0, 0, 0, 0.05)`
- Buttons (hover): `0 4px 12px rgba(210, 181, 97, 0.35)`
- Buttons (rest): `0 2px 8px rgba(210, 181, 97, 0.25)`

## Component Styling

### Buttons
```css
/* Primary Button */
background: #d2b561;
color: white;
box-shadow: 0 2px 8px rgba(210, 181, 97, 0.25);

/* Hover */
background: #b58863;
box-shadow: 0 4px 12px rgba(210, 181, 97, 0.35);
```

### Tables
```css
/* Table Header */
background: #ffd9d9;
color: #2d2416;

/* Row Hover */
background: #faf8f3;
```

### Badges
```css
/* Primary Badge */
background: #ffd9d9;
color: #8b7332;
```

### Form Inputs
```css
/* Focus State */
border-color: #d2b561;
box-shadow: 0 0 0 3px rgba(210, 181, 97, 0.1);
```

### Sidebar
```css
/* Background */
background: #b58863;
color: #2d2416;

/* Active Menu Item */
background: rgba(45, 36, 22, 0.15);
border-left: 3px solid #8b7332;
```

## CSS Variables

Use these CSS variables for consistency:

```css
:root {
  --admin-primary: #d2b561;
  --admin-primary-dark: #b58863;
  --admin-primary-darker: #8b7332;
  --admin-primary-light: #e5d9a8;
  --admin-primary-lighter: #ffd9d9;
  --admin-bg: #faf8f3;
  --admin-card-bg: #ffffff;
  --admin-text: #2d2416;
  --admin-text-light: #666;
  --admin-border: #e8e3d5;
  --admin-hover: #ffd9d9;
}
```

## Typography

### Headings
- Page Title: `2rem` (32px), weight: `700`
- Section Title: `1.5rem` (24px), weight: `600`
- Card Title: `1.3rem` (21px), weight: `600`

### Body Text
- Regular: `1rem` (16px)
- Small: `0.9rem` (14px)
- Tiny: `0.85rem` (13px)

## Accessibility

- Maintain WCAG AA contrast ratios
- Use semantic HTML elements
- Provide clear focus states
- Include proper ARIA labels

## Best Practices

1. **Consistency**: Use the same colors across all admin pages
2. **Simplicity**: Avoid complex gradients and effects
3. **Readability**: Ensure text has sufficient contrast
4. **Responsiveness**: Design mobile-first
5. **Performance**: Minimize CSS and use efficient selectors

## File Structure

All admin styles are located in:
- Layout: `src/layouts/AdminLayout/`
- Pages: `src/pages/Admin/[PageName]/`
- Components: `src/components/Admin/[ComponentName]/`
- Global Theme: `src/pages/Admin/admin-theme.css`

## Migration Notes

If updating from the old orange/purple theme:
- Replace `#ff9800` → `#d2b561`
- Replace `#ff6f00` → `#b58863`
- Replace `#667eea` → `#d2b561`
- Replace `#764ba2` → `#b58863`
- Replace gradients with solid colors
- Update table headers from `#f8f9fa` → `#ffd9d9`
- Update hover backgrounds from `#f8f9fa` → `#faf8f3`
