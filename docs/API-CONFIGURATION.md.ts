
/**
 * ============================================
 * API CONFIGURATION QUICK REFERENCE
 * ============================================
 * 
 * 
 * 📍 WHERE TO UPDATE API URL
 * ==========================
 * 
 * File: services/api.ts
 * Line: 28
 * 
 * const API_BASE_URL = 'YOUR_BACKEND_URL_HERE';
 * 
 * 
 * 🌐 ENVIRONMENT-SPECIFIC URLS
 * ============================
 * 
 * Local Development (iOS Simulator):
 * const API_BASE_URL = 'http://localhost:5000/api';
 * 
 * Local Development (Android Emulator):
 * const API_BASE_URL = 'http://10.0.2.2:5000/api';
 * 
 * Local Development (Physical Device):
 * const API_BASE_URL = 'http://192.168.1.XXX:5000/api';
 * (Replace XXX with your computer's local IP)
 * 
 * Production:
 * const API_BASE_URL = 'https://your-backend.com/api';
 * 
 * 
 * 🔍 HOW TO FIND YOUR LOCAL IP
 * =============================
 * 
 * macOS/Linux:
 * ifconfig | grep "inet " | grep -v 127.0.0.1
 * 
 * Windows:
 * ipconfig
 * (Look for IPv4 Address)
 * 
 * 
 * ✅ TESTING YOUR BACKEND
 * =======================
 * 
 * Test if backend is running:
 * curl http://localhost:5000/api/auth/login
 * 
 * Should return an error (since no credentials provided)
 * but confirms the endpoint exists.
 * 
 * 
 * 🔐 AUTHENTICATION FLOW
 * ======================
 * 
 * 1. User signs up or logs in
 * 2. Backend returns JWT token
 * 3. Token stored in AsyncStorage
 * 4. All subsequent requests include:
 *    Authorization: Bearer <token>
 * 
 * 
 * 📦 RESPONSE FORMATS
 * ===================
 * 
 * Success Response:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "507f1f77bcf86cd799439011",
 *     "username": "john_doe",
 *     "email": "john@example.com"
 *   }
 * }
 * 
 * Error Response:
 * {
 *   "message": "Invalid credentials"
 * }
 * 
 * 
 * 🛠️ BACKEND REQUIREMENTS
 * =======================
 * 
 * Required:
 * - Node.js (v14+)
 * - MongoDB (v4+)
 * - Express.js
 * - JWT for authentication
 * - CORS enabled
 * 
 * Environment Variables:
 * - MONGODB_URI
 * - JWT_SECRET
 * - PORT (default: 5000)
 * 
 * 
 * 🔄 DATA SYNCHRONIZATION
 * =======================
 * 
 * The app syncs data with backend for:
 * ✅ User authentication
 * ✅ Task CRUD operations
 * ✅ Pomodoro session tracking
 * ✅ Statistics calculation
 * 
 * Local storage used for:
 * ✅ Auth token
 * ✅ Timer state
 * ✅ Settings
 * ✅ Offline caching
 * 
 * 
 * 🚨 COMMON ISSUES
 * ================
 * 
 * Issue: "Network request failed"
 * Fix: Check API_BASE_URL matches your backend
 * 
 * Issue: "CORS error"
 * Fix: Enable CORS in backend with:
 *      app.use(cors());
 * 
 * Issue: "401 Unauthorized"
 * Fix: Check JWT token is valid and not expired
 * 
 * Issue: "Cannot connect from physical device"
 * Fix: Use computer's local IP, not localhost
 *      Ensure firewall allows connections on port 5000
 * 
 * 
 * 📱 TESTING CHECKLIST
 * ====================
 * 
 * □ Backend server is running
 * □ MongoDB is connected
 * □ API_BASE_URL is correct
 * □ Can sign up new user
 * □ Can log in existing user
 * □ Can create tasks
 * □ Can edit tasks
 * □ Can delete tasks
 * □ Timer completes and saves session
 * □ Statistics display correctly
 * □ Can log out
 * 
 * 
 * 🎯 PRODUCTION DEPLOYMENT
 * ========================
 * 
 * Before deploying:
 * 1. Update API_BASE_URL to production URL
 * 2. Ensure backend has HTTPS
 * 3. Set strong JWT_SECRET
 * 4. Use MongoDB Atlas for database
 * 5. Enable rate limiting
 * 6. Add error logging
 * 7. Test all endpoints
 * 
 */

export {};
