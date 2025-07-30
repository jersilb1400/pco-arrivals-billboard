# PCO Arrivals Billboard - Billboard Display Page Documentation

## Overview
The Billboard Display Page is the real-time public-facing screen for child pickup notifications. It shows all children awaiting pickup, grouped by security code and location, and updates automatically as notifications change.

This document details all UI elements, business logic, and API calls required to reproduce the Billboard Display Page.

---

## UI Elements & State

### 1. **Header**
- **Element:** `<header>` or `<div class="billboard-header">`
- **Content:**
  - Application title (e.g., "Child Pickup Requests")
  - Event name (from global billboard state)
  - Count of children ready for pickup

### 2. **Pickup List**
- **Element:** `<div class="billboard-content">`
- **State:** `arrivals` (array of active notifications)
- **Behavior:**
  - Displays each child awaiting pickup
  - Shows child name, security code, location, and time
  - Groups by security code and/or household if needed
- **API Call:**
  - `GET /api/active-notifications?eventId={eventId}&eventDate={eventDate}`

### 3. **No Notifications Message**
- **Element:** `<div class="no-notifications">`
- **Behavior:**
  - Shows a message if there are no active pickup requests

### 4. **Last Updated Indicator**
- **Element:** `<span class="last-updated">`
- **State:** `lastUpdated` (timestamp)
- **Behavior:**
  - Shows the last time the data was refreshed

### 5. **Manual Refresh Button**
- **Element:** `<button class="refresh">`
- **Behavior:**
  - Allows user to manually refresh the list
  - Calls the same API as the polling

### 6. **Fullscreen Toggle (Optional)**
- **Element:** `<button class="fullscreen">`
- **Behavior:**
  - Toggles fullscreen mode for display screens

### 7. **Navigation/Back to Admin (Optional)**
- **Element:** `<button class="back-to-admin">`
- **Behavior:**
  - Navigates back to the admin panel

---

## Business Logic & Flow

1. **On Page Load:**
   - Check authentication: `GET /api/auth-status`
   - If not authenticated, redirect to login
   - Load global billboard state: `GET /api/global-billboard`
   - If no active billboard, show message and/or redirect
   - Load active notifications for current event/date

2. **Polling for Updates:**
   - Every 10 seconds, call `/api/billboard-updates?lastUpdate={lastUpdated}&eventId={eventId}`
   - If updates are found, refresh arrivals list
   - Always update `lastUpdated` timestamp

3. **Manual Refresh:**
   - On button click, call `/api/active-notifications?eventId={eventId}&eventDate={eventDate}`
   - Update arrivals list and `lastUpdated`

4. **Grouping/Display:**
   - Group arrivals by security code and/or household for display
   - Show child name, location, security code, and check-in time

5. **Error Handling:**
   - Show error message if API call fails
   - Retry on next polling interval

---

## API Call Reference

| Action                | Method | Endpoint                                         | Payload/Params                |
|-----------------------|--------|--------------------------------------------------|-------------------------------|
| Auth Status           | GET    | `/api/auth-status`                               | -                             |
| Get Global Billboard  | GET    | `/api/global-billboard`                          | -                             |
| Get Notifications     | GET    | `/api/active-notifications?eventId={eventId}&eventDate={eventDate}` | - |
| Check for Updates     | GET    | `/api/billboard-updates?lastUpdate={lastUpdated}&eventId={eventId}` | - |

---

## Example UI Flow

1. **Billboard page loads**
2. **Checks authentication**
3. **Loads global billboard state**
4. **Fetches active notifications**
5. **Displays all children awaiting pickup**
6. **Polls for updates every 10 seconds**
7. **Updates display in real time**
8. **Allows manual refresh and fullscreen toggle**

---

## Notes for AI Implementation
- All API endpoints require authentication (session cookie)
- Polling for updates should be efficient (10s interval)
- UI should be highly visible and readable from a distance
- Use large fonts and clear grouping for security codes
- Show last updated time for transparency
- Provide feedback for manual refresh and errors
- Use semantic HTML and accessible components
- Follow the business logic and API contract exactly as described

---

This document provides a complete blueprint for reproducing the Billboard Display Page of the PCO Arrivals Billboard application, including all UI, business logic, and API interactions. 