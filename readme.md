# ♟️ Real-Time Competitive Chess Platform  
A scalable multiplayer chess game with real-time rooms, puzzles, leaderboards, and WebSocket gameplay.

---

## 🚀 Overview
This project is a **real-time competitive chess platform** where users can:

- Join or create game rooms  
- Play live competitive chess  
- Solve predefined puzzle boards  
- Compete on leaderboards  
- Track moves in real time  
- Enjoy a scalable, smooth experience for 100+ players  

The goal is to deliver a modern, fast, and reliable chess experience.

---

## 🌟 Features

### 🎮 Gameplay
- Real-time chess using WebSockets  
- Legal move validation with **Chess.js**  
- Move history tracking  
- Game timer support  
- Smooth UI animations  

### 🏠 Room System
- Create or join game rooms  
- Auto-match or join via code  
- Live room state (waiting → started → finished)  
- Synchronized board between players  

### 🧩 Puzzle System (Predefined Boards)
- Admin can create puzzle boards  
- Players solve puzzles like riddles  
- Track attempts, success, and solve time  

### 📊 Leaderboards
- Wins, losses, puzzle score  
- Fast ranking powered by Redis  

### 📱 Responsive UI
- Built with React/Next.js + TailwindCSS  
- Mobile-friendly layout  

---

## 🧰 Tech Stack

### **Frontend**
- React / Next.js  
- Socket.IO client  
- TailwindCSS  
- Chess.js  
- React-Chessboard  

### **Backend**
- Node.js + Express  
- Socket.IO  
- MongoDB + Mongoose  
- Redis (cache, pub/sub)  
- JWT Authentication  

### **Deployment**
- Nginx  
- PM2  
- AWS EC2  
- Certbot (SSL)  

---


**Flow Description:**
1. Client connects to backend using WebSockets  
2. Server validates moves using Chess.js  
3. Redis stores fast-changing room states  
4. MongoDB stores long-term data (users, puzzles, history)  
5. Redis Pub/Sub syncs multiple backend servers for scaling  

---

## ⚡ Why Redis?

Redis makes the system **fast, scalable, and consistent**:

- **Room State Cache** → avoids constant DB hits  
- **Pub/Sub** → syncs all Socket servers when scaling  
- **Fast leaderboard** using sorted sets  
- **Prevents race conditions** in simultaneous moves  
- **In-memory speed** → microsecond responses  

Without Redis, real-time gaming at scale becomes slow and inconsistent.

---

## 🌐 How Real-Time Gameplay Works (WebSockets)

1. Player moves a piece  
2. Move sent via WebSocket to backend  
3. Backend validates with Chess.js  
4. Room state updated in Redis  
5. Opponent instantly receives the updated board  
6. UI refreshes without delays  

This produces **0–50ms latency**, ideal for real-time gaming.

---

## 🧩 Puzzle Module

Puzzles include:
- **FEN string**  
- **Expected moves/solution**  
- **Difficulty**  
- **Timer**  
- **Attempts tracking**

Players solve puzzles like a riddle or training mode.

---

---

## ▶️ How to Run Locally

### 1️⃣ Clone the repo
```bash
git clone https://github.com/your-username/chess-platform.git
cd chess-platform


npm install
cd client && npm install

npm run dev


cd client
npm run dev




---

