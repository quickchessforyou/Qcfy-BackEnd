# Admin Panel - Navigation Flow & Page Details

## 🗺️ Complete Navigation Map

```
┌─────────────────────────────────────────────────────────────┐
│                      ADMIN PANEL (/admin)                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────┐                          ┌──────────────┐
│   SIDEBAR     │                          │   TOPBAR     │
│  (Collapsible)│                          │  - Notif 🔔  │
│               │                          │  - Admin 👤  │
└───────────────┘                          └──────────────┘
        │
        ├─► 📊 Dashboard (/admin)
        │   ├─ Stats Cards (4)
        │   ├─ Quick Actions (4 buttons)
        │   ├─ Recent Competitions Table
        │   └─ Recent Puzzles Table
        │
        ├─► 🧩 Puzzle Management
        │   │
        │   ├─► 📁 Categories (/admin/categories)
        │   │   ├─ Grid View (4 cards)
        │   │   ├─ Add Category Button
        │   │   └─ Edit/Delete Actions
        │   │
        │   └─► ♟️ Puzzles (/admin/puzzles)
        │       ├─ Search Bar
        │       ├─ Category Filter
        │       ├─ Difficulty Filter
        │       ├─ Puzzle Table
        │       ├─ Preview Modal (👁️)
        │       ├─ Edit Button (✏️)
        │       ├─ Delete Button (🗑️)
        │       └─ Create Puzzle Button
        │
        ├─► 🏆 Competition
        │   │
        │   ├─► 📋 All Competitions (/admin/competitions)
        │   │   ├─ Tabs: All | Upcoming | Live | ENDED
        │   │   ├─ Competition Table
        │   │   ├─ Status Badges
        │   │   ├─ View Details (👁️)
        │   │   ├─ Edit (✏️)
        │   │   ├─ Delete (🗑️)
        │   │   └─ Create Competition Button
        │   │
        │   ├─► ➕ Create Competition (/admin/competitions/create)
        │   │   └─ [To be implemented]
        │   │
        │   ├─► 🔴 Live Tournaments (/admin/competitions/live)
        │   │   ├─ Live Tournament Cards (2)
        │   │   │   ├─ Progress Bar
        │   │   │   ├─ Player Stats
        │   │   │   └─ Control Buttons (View, Pause, End)
        │   │   └─ Live Leaderboard Section
        │   │       └─ Animated Progress Track with Cars 🏎️
        │   │
        │   └─► 📜 History (/admin/competitions/history)
        │       └─ [To be implemented]
        │
        ├─► 🥇 Leaderboard (/admin/leaderboard)
        │   ├─ Time Filter (All Time, Month, Week)
        │   ├─ Export Button
        │   ├─ Podium Display (Top 3)
        │   │   ├─ 🥇 1st Place
        │   │   ├─ 🥈 2nd Place
        │   │   └─ 🥉 3rd Place
        │   └─ Full Ranking Table
        │
        ├─► 👥 User Management
        │   │
        │   ├─► 🎓 Students (/admin/students)
        │   │   ├─ Search Bar
        │   │   ├─ Status Filter
        │   │   ├─ Student Table
        │   │   │   ├─ Avatar Display
        │   │   │   ├─ Score Tracking
        │   │   │   └─ Status Badge
        │   │   ├─ View Details (👁️)
        │   │   └─ Edit (✏️)
        │   │
        │   └─► 👨‍💼 Admins (/admin/admins)
        │       └─ [To be implemented]
        │
        ├─► 📈 Reports (/admin/reports)
        │   ├─ Report Cards (4)
        │   │   ├─ Puzzle Submissions
        │   │   ├─ Competition Analytics
        │   │   ├─ User Activity
        │   │   └─ Growth Metrics
        │   └─ Export Section
        │       ├─ CSV Export
        │       ├─ PDF Export
        │       └─ Excel Export
        │
        ├─► 🖥️ System Monitor (/admin/monitoring)
        │   ├─ Stats Grid (4 cards)
        │   │   ├─ Active Connections
        │   │   ├─ Memory Usage
        │   │   ├─ CPU Usage
        │   │   └─ Network
        │   ├─ Service Health Section
        │   │   ├─ API Server
        │   │   ├─ Database
        │   │   ├─ WebSocket
        │   │   └─ Cache Server
        │   └─ System Logs
        │       └─ Real-time Log Viewer
        │
        ├─► ⚙️ Settings (/admin/settings)
        │   ├─ System Settings
        │   │   ├─ JWT Token Expiry
        │   │   ├─ Session Timeout
        │   │   └─ Max Login Attempts
        │   ├─ Scoring Settings
        │   │   ├─ Easy Points
        │   │   ├─ Medium Points
        │   │   ├─ Hard Points
        │   │   └─ Expert Points
        │   ├─ Branding
        │   │   ├─ Platform Name
        │   │   ├─ Logo Upload
        │   │   └─ Theme Color
        │   └─ Email Settings
        │       ├─ SMTP Server
        │       ├─ SMTP Port
        │       └─ From Email
        │
        └─► 🏠 Back to Site (/)
```

## 📊 Page Component Breakdown

### 1. Dashboard (`/admin`)
**Components:**
- StatCard × 4 (Users, Puzzles, Competitions, Live)
- ActionButton × 4 (Create Puzzle, Create Competition, Manage Users, View Reports)
- RecentTable × 2 (Competitions, Puzzles)

**Actions:**
- Navigate to any section via quick actions
- View recent activity
- Monitor key metrics

---

### 2. Categories (`/admin/categories`)
**Components:**
- CategoryCard × 4 (Grid layout)
- CreateButton
- ActionButtons (Edit, Delete)

**Actions:**
- View all categories
- Add new category
- Edit category
- Delete category

---

### 3. Puzzles (`/admin/puzzles`)
**Components:**
- SearchInput
- FilterSelect × 2 (Category, Difficulty)
- PuzzleTable
- PreviewModal
- CreateButton

**Actions:**
- Search puzzles
- Filter by category/difficulty
- Preview puzzle (modal with chessboard)
- Edit puzzle
- Delete puzzle
- Create new puzzle

---

### 4. Competitions (`/admin/competitions`)
**Components:**
- TabBar (All, Upcoming, Live, ENDED)
- CompetitionTable
- StatusBadge
- CreateButton

**Actions:**
- Switch between tabs
- View competition details
- Edit competition
- Delete competition
- Create new competition

---

### 5. Live Tournaments (`/admin/competitions/live`)
**Components:**
- TournamentCard × 2
- ProgressBar
- LiveBadge (animated)
- ControlButtons (View, Pause, End)
- LeaderboardSection
- AnimatedProgressTrack

**Actions:**
- Monitor live tournaments
- View real-time progress
- Control tournament (pause/end)
- View live leaderboard

---

### 6. Leaderboard (`/admin/leaderboard`)
**Components:**
- FilterSelect (Time period)
- ExportButton
- PodiumDisplay (Top 3)
- RankingTable

**Actions:**
- Filter by time period
- Export leaderboard
- View player rankings

---

### 7. Students (`/admin/students`)
**Components:**
- SearchInput
- StatusFilter
- StudentTable
- AvatarDisplay
- StatusBadge

**Actions:**
- Search students
- Filter by status
- View student details
- Edit student info

---

### 8. Reports (`/admin/reports`)
**Components:**
- ReportCard × 4
- ExportButton × 3 (CSV, PDF, Excel)

**Actions:**
- View different report types
- Export data in various formats

---

### 9. System Monitor (`/admin/monitoring`)
**Components:**
- StatCard × 4 (Connections, Memory, CPU, Network)
- HealthCard × 4 (Services)
- LogViewer

**Actions:**
- Monitor system health
- View service status
- Read real-time logs

---

### 10. Settings (`/admin/settings`)
**Components:**
- SettingsSection × 4
- FormGroup (multiple)
- SaveButton

**Actions:**
- Configure system settings
- Update scoring rules
- Customize branding
- Set email configuration

---

## 🎯 User Flows

### Flow 1: Create a Puzzle
```
Dashboard → Puzzles → Create Puzzle Button → [Form Page]
```

### Flow 2: Monitor Live Tournament
```
Dashboard → Live Tournaments → View Tournament Card → See Leaderboard
```

### Flow 3: Manage Students
```
Dashboard → Students → Search/Filter → View Details → Edit
```

### Flow 4: View Reports
```
Dashboard → Reports → Select Report Type → Export Data
```

### Flow 5: Check System Health
```
Dashboard → System Monitor → View Health Cards → Check Logs
```

## 🔄 Interactive Elements

### Sidebar
- **Toggle Button**: Collapse/Expand (☰ ↔ ✕)
- **Menu Items**: Hover effects, active state
- **Submenu Groups**: Organized sections

### Tables
- **Hover**: Row highlight
- **Actions**: Icon buttons (👁️ ✏️ 🗑️)
- **Sorting**: Column headers (to be implemented)

### Modals
- **Preview**: Click outside to close
- **Confirmation**: Delete confirmations

### Badges
- **Status**: Color-coded (Live, Upcoming, ENDED)
- **Difficulty**: Color-coded (Easy, Medium, Hard, Expert)
- **Animated**: Pulse effect for "Live" status

### Buttons
- **Hover**: Lift effect (translateY)
- **Gradient**: Primary action buttons
- **Icons**: Emoji icons for visual clarity

## 📱 Responsive Behavior

### Desktop (> 1024px)
- Full sidebar (260px)
- Multi-column grids
- Full tables

### Tablet (768px - 1024px)
- Collapsible sidebar
- 2-column grids
- Scrollable tables

### Mobile (< 768px)
- Collapsed sidebar by default
- Single column layout
- Stacked components
- Horizontal scroll for tables

## 🎨 Visual Hierarchy

1. **Primary**: Dashboard stats, Create buttons
2. **Secondary**: Tables, Lists
3. **Tertiary**: Action buttons, Filters
4. **Accent**: Status badges, Notifications

## ✨ Animations

- Sidebar toggle: 0.3s ease
- Button hover: translateY(-2px)
- Card hover: translateY(-5px)
- Modal: fadeIn + slideUp
- Live badge: pulse (2s infinite)
- Progress bars: width transition (0.5s)
