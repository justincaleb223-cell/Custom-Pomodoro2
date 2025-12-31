
/**
 * ============================================
 * APP STRUCTURE DOCUMENTATION
 * ============================================
 * 
 * 
 * 📁 PROJECT STRUCTURE
 * ====================
 * 
 * pomodoro-app/
 * ├── app/                          # Expo Router screens
 * │   ├── _layout.tsx              # Root layout with providers
 * │   ├── auth/                    # Authentication flow
 * │   │   ├── _layout.tsx         # Auth layout
 * │   │   └── index.tsx           # Login/Signup screen
 * │   └── (tabs)/                 # Main app tabs
 * │       ├── _layout.tsx         # Tab layout with FloatingTabBar
 * │       ├── index.tsx           # Timer screen (home)
 * │       ├── tasks.tsx           # Task management
 * │       ├── stats.tsx           # Statistics
 * │       └── settings.tsx        # Settings & logout
 * │
 * ├── components/                  # Reusable components
 * │   ├── FloatingTabBar.tsx      # Custom tab bar
 * │   ├── IconSymbol.tsx          # Cross-platform icons
 * │   └── ...                     # Other components
 * │
 * ├── contexts/                    # React Context providers
 * │   ├── PomodoroContext.tsx     # Timer state management
 * │   └── AuthContext.tsx         # Auth state (Supabase)
 * │
 * ├── services/                    # API integration
 * │   └── api.ts                  # MERN backend API calls
 * │
 * ├── types/                       # TypeScript types
 * │   └── index.ts                # Shared type definitions
 * │
 * ├── styles/                      # Styling
 * │   └── commonStyles.ts         # Theme & common styles
 * │
 * ├── docs/                        # Documentation
 * │   ├── backend-setup.md.ts     # Backend setup guide
 * │   ├── MERN-INTEGRATION-GUIDE.md.ts
 * │   ├── API-CONFIGURATION.md.ts
 * │   ├── GETTING-STARTED.md.ts
 * │   └── APP-STRUCTURE.md.ts     # This file
 * │
 * └── package.json                 # Dependencies
 * 
 * 
 * 🎯 KEY FILES EXPLAINED
 * ======================
 * 
 * app/_layout.tsx
 * ---------------
 * - Root layout component
 * - Wraps app with PomodoroProvider
 * - Configures navigation theme
 * - Handles font loading
 * - Network status monitoring
 * 
 * app/auth/index.tsx
 * ------------------
 * - Login/Signup screen
 * - Tab switcher between login and signup
 * - Form validation
 * - API integration for auth
 * - Auto-redirect if already logged in
 * 
 * app/(tabs)/index.tsx (Timer Screen)
 * -----------------------------------
 * - Main Pomodoro timer display
 * - Circular progress indicator
 * - Start/Pause/Resume/Reset controls
 * - Shows selected task
 * - Displays session count
 * - Mode indicator (Focus/Break/Long Break)
 * 
 * app/(tabs)/tasks.tsx
 * --------------------
 * - Task list display
 * - Create new task modal
 * - Edit existing tasks
 * - Delete tasks
 * - Select task for timer
 * - Visual indicator for selected task
 * 
 * app/(tabs)/stats.tsx
 * --------------------
 * - Overall progress summary
 * - Daily statistics chart
 * - Task breakdown
 * - Total Pomodoros completed
 * - Total focus time
 * 
 * app/(tabs)/settings.tsx
 * -----------------------
 * - Timer duration settings
 * - Focus duration
 * - Short break duration
 * - Long break duration
 * - Sessions until long break
 * - Backend configuration info
 * - Logout button
 * 
 * contexts/PomodoroContext.tsx
 * ----------------------------
 * - Global timer state
 * - Timer controls (start, pause, resume, reset)
 * - Selected task management
 * - Settings management
 * - Timer persistence
 * - Background timer support
 * - Session completion handling
 * 
 * services/api.ts
 * ---------------
 * - API base URL configuration
 * - Authentication API calls
 * - Tasks API calls
 * - Sessions API calls
 * - Settings API calls
 * - Token management
 * - Error handling
 * 
 * types/index.ts
 * --------------
 * - Task interface
 * - PomodoroSession interface
 * - User interface
 * - TimerSettings interface
 * - DailyStats interface
 * - TaskStats interface
 * 
 * styles/commonStyles.ts
 * ----------------------
 * - Color palette (light & dark)
 * - Button styles
 * - Common component styles
 * - Theme configuration
 * 
 * 
 * 🔄 DATA FLOW
 * ============
 * 
 * Authentication Flow:
 * 1. User enters credentials in auth/index.tsx
 * 2. authAPI.login() called in services/api.ts
 * 3. Backend validates and returns JWT token
 * 4. Token stored in AsyncStorage
 * 5. User redirected to (tabs) route
 * 
 * Task Management Flow:
 * 1. User creates task in tasks.tsx
 * 2. tasksAPI.createTask() called
 * 3. Backend saves to MongoDB
 * 4. Task added to local state
 * 5. Task appears in list
 * 
 * Timer Flow:
 * 1. User selects task in tasks.tsx
 * 2. Task stored in PomodoroContext
 * 3. User starts timer in index.tsx
 * 4. Timer runs locally with setInterval
 * 5. Timer state saved to AsyncStorage
 * 6. On completion, session saved to backend
 * 7. Statistics updated
 * 
 * Statistics Flow:
 * 1. stats.tsx loads on mount
 * 2. sessionsAPI.getDailyStats() called
 * 3. sessionsAPI.getTaskStats() called
 * 4. Backend aggregates data from MongoDB
 * 5. Stats displayed in charts
 * 
 * 
 * 🎨 UI COMPONENTS
 * ================
 * 
 * FloatingTabBar
 * --------------
 * - Custom bottom tab bar
 * - Floating design
 * - Active tab indicator
 * - Icon + label
 * - Smooth animations
 * 
 * IconSymbol
 * ----------
 * - Cross-platform icon component
 * - iOS SF Symbols
 * - Android Material Icons
 * - Consistent API
 * 
 * 
 * 🔐 AUTHENTICATION
 * =================
 * 
 * Token Storage:
 * - JWT token in AsyncStorage
 * - Key: 'authToken'
 * - Included in all API requests
 * - Header: Authorization: Bearer <token>
 * 
 * User Data:
 * - User object in AsyncStorage
 * - Key: 'user'
 * - Contains: id, username, email
 * 
 * 
 * 💾 LOCAL STORAGE
 * ================
 * 
 * AsyncStorage Keys:
 * - 'authToken' - JWT authentication token
 * - 'user' - User object
 * - 'timerState' - Current timer state
 * - 'timerSettings' - Timer configuration
 * 
 * 
 * 🎯 STATE MANAGEMENT
 * ===================
 * 
 * Global State (Context):
 * - PomodoroContext: Timer state, selected task, settings
 * - AuthContext: User authentication (Supabase - not used with MERN)
 * 
 * Local State (useState):
 * - Component-specific UI state
 * - Form inputs
 * - Loading states
 * - Modal visibility
 * 
 * Persistent State (AsyncStorage):
 * - Auth token
 * - Timer state
 * - Settings
 * 
 * 
 * 🔔 FEATURES
 * ===========
 * 
 * Timer Features:
 * ✅ Start/Pause/Resume/Reset
 * ✅ Configurable durations
 * ✅ Focus/Short Break/Long Break modes
 * ✅ Automatic mode switching
 * ✅ Session counting
 * ✅ Persistence across app restarts
 * ✅ Background timer support
 * ✅ Haptic feedback
 * 
 * Task Features:
 * ✅ Create tasks
 * ✅ Edit tasks
 * ✅ Delete tasks
 * ✅ Select task for timer
 * ✅ Task descriptions
 * ✅ Visual selection indicator
 * 
 * Statistics Features:
 * ✅ Total Pomodoros
 * ✅ Total focus time
 * ✅ Daily progress chart
 * ✅ Task breakdown
 * ✅ Time formatting
 * 
 * UI Features:
 * ✅ Dark mode support
 * ✅ Smooth animations
 * ✅ Haptic feedback
 * ✅ Loading states
 * ✅ Error handling
 * ✅ Offline support
 * ✅ Network status alerts
 * 
 * 
 * 🛠️ CUSTOMIZATION
 * =================
 * 
 * Change Colors:
 * - Edit styles/commonStyles.ts
 * - Update colors.light and colors.dark
 * 
 * Change Timer Defaults:
 * - Edit contexts/PomodoroContext.tsx
 * - Update initial settings state
 * 
 * Change API URL:
 * - Edit services/api.ts
 * - Update API_BASE_URL constant
 * 
 * Add New Tab:
 * - Create new file in app/(tabs)/
 * - Add to tabs array in app/(tabs)/_layout.tsx
 * 
 * 
 * 📱 PLATFORM SUPPORT
 * ===================
 * 
 * iOS:
 * ✅ iPhone
 * ✅ iPad
 * ✅ iOS Simulator
 * ✅ SF Symbols icons
 * 
 * Android:
 * ✅ Phone
 * ✅ Tablet
 * ✅ Android Emulator
 * ✅ Material Icons
 * 
 * Web:
 * ⚠️ Limited support (Expo web)
 * 
 * 
 * 🔧 DEPENDENCIES
 * ===============
 * 
 * Core:
 * - react-native
 * - expo
 * - expo-router
 * 
 * UI:
 * - @expo/vector-icons
 * - react-native-reanimated
 * - react-native-gesture-handler
 * 
 * Storage:
 * - @react-native-async-storage/async-storage
 * 
 * Utilities:
 * - expo-haptics
 * - expo-network
 * - expo-font
 * 
 * 
 * 🚀 PERFORMANCE
 * ==============
 * 
 * Optimizations:
 * - Timer uses setInterval (efficient)
 * - AsyncStorage for persistence
 * - Minimal re-renders with Context
 * - Lazy loading of screens
 * - Optimized images
 * 
 * 
 * 🧪 TESTING
 * ==========
 * 
 * Manual Testing:
 * 1. Test authentication flow
 * 2. Test task CRUD operations
 * 3. Test timer functionality
 * 4. Test timer persistence
 * 5. Test background timer
 * 6. Test statistics
 * 7. Test settings
 * 8. Test offline mode
 * 9. Test dark mode
 * 10. Test on multiple devices
 * 
 * 
 * 📝 NOTES
 * ========
 * 
 * - Timer runs locally for performance
 * - Sessions saved to backend on completion
 * - Settings stored locally and in backend
 * - Offline mode supported for timer
 * - Network required for tasks and stats
 * - Dark mode follows system preference
 * - Haptic feedback on iOS and Android
 * 
 */

export {};
