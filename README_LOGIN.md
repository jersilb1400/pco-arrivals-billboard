# PCO Arrivals Billboard - Login Page Documentation

## Overview
The Login Page is the entry point for all users. It handles authentication via Planning Center Online (PCO) OAuth 2.0, manages session state, and provides user feedback for login errors or status.

This document details all UI elements, business logic, and API calls required to reproduce the Login Page.

---

## UI Elements & State

### 1. **Logo and Branding**
- **Element:** `<img src="logo.png">`, `<h1>`, etc.
- **Content:** Application logo and title

### 2. **Login Button**
- **Element:** `<button class="login">`
- **Behavior:**
  - On click, redirects to `/api/auth/pco?remember={rememberMe}`
  - Optionally includes a "Remember Me" checkbox

### 3. **Remember Me Checkbox**
- **Element:** `<input type="checkbox">`
- **State:** `rememberMe` (boolean)
- **Behavior:**
  - If checked, sets longer session duration (30 days)
  - Value is passed as a query param to the login endpoint

### 4. **Status/Feedback Message**
- **Element:** `<div class="status">` or `<div class="alert">`
- **Behavior:**
  - Shows error or info messages (e.g., "Not logged in", "Login failed")

### 5. **Loading Indicator**
- **Element:** `<div class="loading">` or spinner
- **Behavior:**
  - Shows while checking authentication status

---

## Business Logic & Flow

1. **On Page Load:**
   - Call `GET /api/auth-status`
   - If authenticated, redirect to admin or billboard page
   - If not, show login form

2. **On Login Button Click:**
   - Redirect to `/api/auth/pco?remember={rememberMe}`
   - User completes OAuth flow with PCO
   - On success, redirected back to `/auth/callback` and then to admin page

3. **On OAuth Callback:**
   - Server processes code, creates session, and redirects to admin page

4. **On Error:**
   - Show error message if authentication fails
   - Allow user to retry login

5. **Remember Me:**
   - If checked, session cookie is set for 30 days
   - If not, session lasts for 24 hours

---

## API Call Reference

| Action                | Method | Endpoint                                         | Payload/Params                |
|-----------------------|--------|--------------------------------------------------|-------------------------------|
| Auth Status           | GET    | `/api/auth-status`                               | -                             |
| Initiate OAuth        | GET    | `/api/auth/pco?remember={rememberMe}`            | -                             |
| OAuth Callback        | GET    | `/auth/callback?code=...`                        | -                             |

---

## Example UI Flow

1. **User visits login page**
2. **App checks authentication status**
3. **If not authenticated, shows login button**
4. **User clicks login, is redirected to PCO**
5. **User completes OAuth, is redirected back**
6. **App checks session, redirects to admin page**

---

## Notes for AI Implementation
- All API endpoints require authentication (session cookie) except login
- Use semantic HTML and accessible components
- Provide clear feedback for errors and loading
- Follow the business logic and API contract exactly as described

---

This document provides a complete blueprint for reproducing the Login Page of the PCO Arrivals Billboard application, including all UI, business logic, and API interactions. 