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

## 🧱 System Architecture

