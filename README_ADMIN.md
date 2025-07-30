# PCO Arrivals Billboard - Admin Page Documentation

## Overview
The Admin Page is the central control panel for managing child pickup notifications, events, and billboards. It allows authorized users to:
- Select a date and event
- Manage security codes
- Launch and clear billboards
- Monitor real-time pickup notifications
- Access all relevant event and check-in data via API

This document details all UI elements, business logic, and API calls required to reproduce the Admin Page.

---

## UI Elements & State

### 1. **Date Picker**
- **Element:** `<input type="date">`
- **State:** `selectedDate` (YYYY-MM-DD)
- **Behavior:** On change, triggers event loading for the selected date.
- **API Call:**
  - `GET /api/events-by-date?date={selectedDate}`

### 2. **Event Selector**
- **Element:** `<select>`
- **State:** `selectedEvent` (event ID)
- **Behavior:** On change, loads event details and resets security codes.
- **API Call:**
  - `GET /api/events-by-date?date={selectedDate}` (for options)
  - `GET /api/events/{eventId}/event-times` (optional, for event times)

### 3. **Security Code Management**
- **Elements:**
  - List of current security codes (chips/tags)
  - Input to add new code
  - Button to add code
  - Button to remove code
- **State:** `securityCodes` (array of strings)
- **Behavior:**
  - Add: Validates and adds code to list
  - Remove: Deletes code from list
- **API Call (on add):**
  - `POST /api/security-code-entry`
    ```json
    {
      "securityCode": "ABC123",
      "eventId": "{selectedEvent}",
      "eventDate": "{selectedDate}"
    }
    ```

### 4. **Launch Billboard**
- **Element:** `<button>`
- **State:** Uses `selectedEvent`, `securityCodes`, `selectedDate`
- **Behavior:**
  - Validates all fields
  - Calls API to set global billboard state
- **API Call:**
  - `POST /api/global-billboard`
    ```json
    {
      "eventId": "{selectedEvent}",
      "eventName": "{eventName}",
      "securityCodes": ["ABC123", "DEF456"],
      "eventDate": "{selectedDate}"
    }
    ```

### 5. **Clear Billboard**
- **Element:** `<button>`
- **Behavior:**
  - Calls API to clear global billboard state and notifications
- **API Call:**
  - `DELETE /api/global-billboard`

### 6. **Active Pickup Notifications**
- **Element:** List/table of notifications
- **State:** `activeNotifications` (array)
- **Behavior:**
  - Polls API every 10 seconds (only when billboard is active)
  - Displays child name, security code, location, time
- **API Call:**
  - `GET /api/active-notifications?eventId={selectedEvent}&eventDate={selectedDate}`

### 7. **Snackbar/Alerts**
- **Element:** Toast/snackbar for feedback
- **Behavior:**
  - Shows success/error/info messages for all actions

### 8. **Navigation/Logout**
- **Elements:**
  - Navigation bar with links to Admin, Billboard, Logout
- **API Call (Logout):**
  - `GET /api/auth/logout`

---

## Business Logic & Flow

1. **On Page Load:**
   - Check authentication: `GET /api/auth-status`
   - If not authenticated, redirect to login
   - Set `selectedDate` to today
   - Load events for today

2. **On Date Change:**
   - Update `selectedDate`
   - Clear `selectedEvent`, `securityCodes`, `activeBillboard`
   - Load events for new date

3. **On Event Change:**
   - Update `selectedEvent`
   - Clear `securityCodes`, `activeBillboard`
   - Optionally load event times/locations

4. **On Add Security Code:**
   - Validate code (non-empty, unique)
   - Add to `securityCodes`
   - Call `/api/security-code-entry` to trigger notification

5. **On Launch Billboard:**
   - Validate all fields
   - Call `/api/global-billboard` to set state
   - Switch to billboard view if needed

6. **On Clear Billboard:**
   - Call `DELETE /api/global-billboard`
   - Clear all local state

7. **Polling for Notifications:**
   - Every 10 seconds, call `/api/active-notifications` if billboard is active
   - Update `activeNotifications` list

8. **Logout:**
   - Call `/api/auth/logout`
   - Redirect to login

---

## API Call Reference

| Action                | Method | Endpoint                                         | Payload/Params                |
|-----------------------|--------|--------------------------------------------------|-------------------------------|
| Auth Status           | GET    | `/api/auth-status`                               | -                             |
| Get Events by Date    | GET    | `/api/events-by-date?date={date}`                | -                             |
| Get Event Times       | GET    | `/api/events/{eventId}/event-times`              | -                             |
| Add Security Code     | POST   | `/api/security-code-entry`                       | `{ securityCode, eventId, eventDate }` |
| Launch Billboard      | POST   | `/api/global-billboard`                          | `{ eventId, eventName, securityCodes, eventDate }` |
| Clear Billboard       | DELETE | `/api/global-billboard`                          | -                             |
| Get Notifications     | GET    | `/api/active-notifications?eventId={eventId}&eventDate={eventDate}` | - |
| Logout                | GET    | `/api/auth/logout`                               | -                             |

---

## Example UI Flow

1. **Admin logs in**
2. **Selects date** (defaults to today)
3. **Selects event** from dropdown
4. **Adds security codes** (as needed)
5. **Launches billboard**
6. **Monitors active pickup notifications**
7. **Clears billboard** when event is over
8. **Logs out**

---

## Notes for AI Implementation
- All API endpoints require authentication (session cookie)
- All state transitions should be reflected in the UI
- Polling for notifications should be efficient (10s interval, only when needed)
- All user actions should provide feedback (success/error)
- Use semantic HTML and accessible components
- Follow the business logic and API contract exactly as described

---

This document provides a complete blueprint for reproducing the Admin Page of the PCO Arrivals Billboard application, including all UI, business logic, and API interactions. 