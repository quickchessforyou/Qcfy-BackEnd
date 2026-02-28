# Implementation Plan: Redirect Unauthenticated Users to Login

The goal was to prevent unauthenticated users from joining a competition and redirect them to the login page (or login modal) instead.

## Changes

### 1. `src/layouts/MainLayout/MainLayout.jsx`

- Added `useEffect` to listen for URL query parameter `?login=true`.
- If detected, `LoginModal` is opened automatically.
- This allows any part of the application to "redirect to login" by navigating to `/?login=true`.

### 2. `src/pages//.jsx`

- Updated `handleParticipate` function.
- Added a check for `!user`.
- If the user is undefined (not logged in), the app now redirects to `/?login=true` using `navigate()`.

## Verification

- **Unauthenticated User**:
  - Go to Dashboard.
  - Click "Participate" on any competition.
  - Should be redirected to Home page and Login Modal should open.
- **Authenticated User**:
  - Click "Participate".
  - Should proceed to competition logic (access code check or puzzle page).
