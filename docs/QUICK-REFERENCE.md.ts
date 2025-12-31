
/**
 * ============================================
 * QUICK REFERENCE CARD
 * ============================================
 * 
 * 
 * 🚀 START BACKEND
 * ================
 * 
 * cd pomodoro-backend
 * npm run dev
 * 
 * Backend runs on: http://localhost:5000
 * 
 * 
 * 🚀 START FRONTEND
 * =================
 * 
 * npm run dev
 * 
 * Then press:
 * - 'i' for iOS
 * - 'a' for Android
 * - Scan QR for physical device
 * 
 * 
 * 🔧 CONFIGURE API URL
 * ====================
 * 
 * File: services/api.ts
 * Line: 28
 * 
 * iOS Simulator:
 * const API_BASE_URL = 'http://localhost:5000/api';
 * 
 * Android Emulator:
 * const API_BASE_URL = 'http://10.0.2.2:5000/api';
 * 
 * Physical Device:
 * const API_BASE_URL = 'http://YOUR_IP:5000/api';
 * 
 * 
 * 🔍 FIND YOUR IP
 * ===============
 * 
 * macOS/Linux:
 * ifconfig | grep "inet "
 * 
 * Windows:
 * ipconfig
 * 
 * 
 * 📦 BACKEND DEPENDENCIES
 * =======================
 * 
 * npm install express mongoose jsonwebtoken bcryptjs cors dotenv
 * npm install --save-dev nodemon
 * 
 * 
 * 🗄️ MONGODB
 * ===========
 * 
 * Local:
 * mongod
 * 
 * Atlas:
 * https://www.mongodb.com/cloud/atlas
 * 
 * 
 * 🔐 ENVIRONMENT VARIABLES
 * ========================
 * 
 * Create .env in backend:
 * 
 * MONGODB_URI=mongodb://localhost:27017/pomodoro
 * JWT_SECRET=your-secret-key-here
 * PORT=5000
 * 
 * 
 * 📱 APP SCREENS
 * ==============
 * 
 * 1. Auth - Login/Signup
 * 2. Timer - Main Pomodoro timer
 * 3. Tasks - Task management
 * 4. Stats - Progress tracking
 * 5. Settings - Configuration
 * 
 * 
 * ⌨️ KEYBOARD SHORTCUTS
 * =====================
 * 
 * Expo Dev Server:
 * - 'i' - Open iOS simulator
 * - 'a' - Open Android emulator
 * - 'w' - Open web browser
 * - 'r' - Reload app
 * - 'j' - Open debugger
 * - 'c' - Clear cache
 * 
 * 
 * 🐛 COMMON ISSUES
 * ================
 * 
 * "Network request failed"
 * → Check API_BASE_URL
 * → Verify backend is running
 * → Use IP for physical device
 * 
 * "401 Unauthorized"
 * → Check JWT_SECRET in backend
 * → Verify token is valid
 * → Try logging in again
 * 
 * "Cannot connect to MongoDB"
 * → Start MongoDB: mongod
 * → Check MONGODB_URI in .env
 * → Verify MongoDB is running
 * 
 * "CORS error"
 * → Add app.use(cors()) in backend
 * → Restart backend server
 * 
 * 
 * 📚 DOCUMENTATION FILES
 * ======================
 * 
 * docs/backend-setup.md.ts
 * → Complete backend setup guide
 * 
 * docs/MERN-INTEGRATION-GUIDE.md.ts
 * → MERN stack integration overview
 * 
 * docs/API-CONFIGURATION.md.ts
 * → API configuration details
 * 
 * docs/GETTING-STARTED.md.ts
 * → Step-by-step setup guide
 * 
 * docs/APP-STRUCTURE.md.ts
 * → Project structure documentation
 * 
 * docs/FEATURES-SUMMARY.md.ts
 * → Complete features list
 * 
 * docs/QUICK-REFERENCE.md.ts
 * → This file
 * 
 * 
 * 🔗 USEFUL LINKS
 * ===============
 * 
 * React Native: https://reactnative.dev
 * Expo: https://docs.expo.dev
 * Express: https://expressjs.com
 * MongoDB: https://docs.mongodb.com
 * Mongoose: https://mongoosejs.com
 * JWT: https://jwt.io
 * 
 * 
 * 💡 TIPS
 * =======
 * 
 * - Always start backend before frontend
 * - Check console for errors
 * - Use correct API URL for your platform
 * - Keep backend and frontend in sync
 * - Test on both iOS and Android
 * - Use MongoDB Compass for database GUI
 * - Use Postman to test API endpoints
 * 
 * 
 * ✅ TESTING CHECKLIST
 * ====================
 * 
 * □ Backend starts without errors
 * □ MongoDB is connected
 * □ Frontend loads successfully
 * □ Can create account
 * □ Can log in
 * □ Can create tasks
 * □ Timer works
 * □ Timer persists
 * □ Sessions are saved
 * □ Statistics display
 * □ Can log out
 * 
 * 
 * 🎯 DEFAULT VALUES
 * =================
 * 
 * Timer:
 * - Focus: 25 minutes
 * - Short Break: 5 minutes
 * - Long Break: 15 minutes
 * - Sessions until long break: 4
 * 
 * API:
 * - Port: 5000
 * - Base URL: /api
 * 
 * Database:
 * - Name: pomodoro
 * - Port: 27017 (default)
 * 
 * 
 * 📞 SUPPORT
 * ==========
 * 
 * Check documentation files in docs/ folder
 * Review console logs for errors
 * Verify all services are running
 * Test API endpoints with Postman
 * 
 */

export {};
