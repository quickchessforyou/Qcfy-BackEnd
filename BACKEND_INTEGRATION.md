# Backend API Integration Summary

This document describes the backend API integration that has been ENDED for the QuickChess4You frontend application.

## ✅ ENDED Integrations

### 1. API Service Layer (`src/services/api.js`)
- Created a centralized API service for all backend communication
- Handles authentication tokens automatically
- Supports both JSON and FormData (for file uploads)
- Base URL configurable via environment variable `VITE_API_BASE_URL`
- Default: `http://localhost:3000/api`

### 2. Authentication APIs Integrated

#### Register (`POST /api/user/register`)
- **Location**: `LoginModal` component
- **Features**:
  - User registration with name, email, password, username
  - Optional avatar file upload
  - Form validation (password match, minimum length)
  - Automatic token storage and redirect to dashboard

#### Login (`POST /api/user/login`)
- **Locations**: 
  - `LoginModal` component
  - `Login` page (`src/pages/Login/Login.jsx`)
- **Features**:
  - Email and password authentication
  - Token storage in localStorage
  - User data storage
  - Automatic redirect to dashboard on success

#### Send OTP (`POST /api/user/send-otp`)
- **Locations**: 
  - `LoginModal` component (via "Forgot password")
  - `Login` page (via "Forgot password")
- **Features**:
  - Sends 6-digit OTP to user's email
  - Switches to OTP verification mode
  - Error handling for invalid emails

#### Verify OTP (`POST /api/user/verify-otp`)
- **Locations**: 
  - `LoginModal` component
  - `Login` page
- **Features**:
  - Verifies 6-digit OTP
  - Automatic login on successful verification
  - Token storage and redirect

### 3. Authentication Utilities (`src/utils/auth.js`)
Created utility functions for:
- `getToken()` - Get stored JWT token
- `getUser()` - Get stored user data
- `isAuthenticated()` - Check authentication status
- `setAuth(token, user)` - Store authentication data
- `clearAuth()` - Clear authentication (logout)
- `getAuthHeader()` - Get authorization header for API requests

### 4. Protected Routes
- **Updated**: `ProtectedRoute` component
- **Features**:
  - Checks backend authentication token
  - Redirects unauthenticated users to home page
  - Supports both user and admin authentication
  - Protected routes:
    - `/` - Requires user authentication
    - `/puzzle` - Requires user authentication
    - `/admin/*` - Requires admin authentication (separate system)

### 5. Navigation & UI Updates

#### Navbar Component
- **Updated**: Displays user information when logged in
- Shows user avatar (if available) or default icon
- Displays user name/username
- Logout button functionality
- Automatically detects authentication state

#### Home Page
- **Updated**: Redirects authenticated users to dashboard
- Prevents logged-in users from accessing login page

#### Dashboard Page
- **Updated**: Uses authentication state
- Can access user data via `getUser()` utility

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `QuickChess4You` directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Note**: Update the URL to match your backend server address.

### Backend Requirements
- Backend must be running on the configured port (default: 3000)
- CORS must be enabled (already configured in backend)
- Backend routes:
  - `POST /api/user/register`
  - `POST /api/user/login`
  - `POST /api/user/send-otp`
  - `POST /api/user/verify-otp`

## 📝 API Response Format

All APIs return responses in the following format:

### Success Response
```json
{
  "message": "Success message",
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "username": "username",
    "avatar": "path/to/avatar.jpg",
    "rating": 1200,
    "wins": 0,
    "losses": 0,
    "draws": 0
  },
  "token": "jwt_token_here"
}
```

### Error Response
```json
{
  "message": "Error message here"
}
```

## 🔐 Authentication Flow

1. **Registration**:
   - User fills registration form
   - Submits with optional avatar
   - Backend creates user and returns token
   - Token stored in localStorage
   - User redirected to dashboard

2. **Login**:
   - User enters email and password
   - Backend validates credentials
   - Returns token and user data
   - Token stored in localStorage
   - User redirected to dashboard

3. **OTP Login**:
   - User clicks "Forgot password" or enters email
   - Backend sends OTP to email
   - User enters OTP
   - Backend verifies OTP
   - Returns token and user data
   - User logged in and redirected

4. **Protected Routes**:
   - Component checks for token in localStorage
   - If no token, redirects to home page
   - If token exists, allows access

5. **Logout**:
   - Clears token and user data from localStorage
   - Redirects to home page
   - Refreshes page to update UI

## 🚀 Usage Examples

### Using Authentication in Components

```javascript
import { isAuthenticated, getUser, clearAuth } from '../../utils/auth';

// Check if user is logged in
if (isAuthenticated()) {
  const user = getUser();
  console.log('User:', user.name);
}

// Logout
const handleLogout = () => {
  clearAuth();
  navigate('/');
};
```

### Making Authenticated API Calls

The API service automatically includes the token in requests:

```javascript
import { authAPI } from '../../services/api';

// Token is automatically included
const response = await authAPI.login(email, password);
```

## 🐛 Error Handling

All API calls include error handling:
- Network errors are caught and displayed
- Backend error messages are shown to users
- Loading states prevent multiple submissions
- Form validation before API calls

## 📋 Files Modified/Created

### Created Files:
- `src/services/api.js` - API service layer
- `src/utils/auth.js` - Authentication utilities
- `BACKEND_INTEGRATION.md` - This documentation

### Modified Files:
- `src/components/LoginModal/LoginModal.jsx` - Integrated all auth APIs
- `src/pages/Login/Login.jsx` - Integrated login and OTP APIs
- `src/components/Navbar/Navbar.jsx` - Added user display and logout
- `src/components/ProtectedRoute/ProtectedRoute.jsx` - Backend auth check
- `src/pages//.jsx` - Updated to use auth
- `src/pages/Home/Home.jsx` - Added auth redirect
- `src/App.jsx` - Protected routes with authentication

## ✅ Testing Checklist

- [ ] Backend server is running
- [ ] Environment variable is set correctly
- [ ] User registration works
- [ ] User login works
- [ ] OTP sending works
- [ ] OTP verification works
- [ ] Protected routes redirect when not authenticated
- [ ] Logout clears authentication
- [ ] User data displays in navbar when logged in
- [ ] Avatar upload works (if backend supports it)

## 🔄 Next Steps

If you need to add more backend APIs:
1. Add the API function to `src/services/api.js`
2. Import and use it in your components
3. Handle responses and errors appropriately

## 📞 Support

For issues or questions:
- Check backend server logs
- Verify CORS configuration
- Check network tab in browser DevTools
- Ensure environment variables are set correctly

