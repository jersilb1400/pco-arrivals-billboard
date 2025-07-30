# PCO Arrivals Billboard - Location Status Page Documentation

## Overview
The Location Status Page provides a real-time overview of all locations (e.g., rooms or areas) with children still awaiting pickup for a specific event and date. It is used by staff or volunteers to monitor which locations have remaining children and to coordinate pickup operations.

This document details all UI elements, business logic, and API calls required to reproduce the Location Status Page.

---

## UI Elements & State

### 1. **Header**
- **Element:** `<header>` or `<div class="location-status-header">`
- **Content:**
  - Page title (e.g., "Location Status")
  - Event name and date

### 2. **Location List/Table**
- **Element:** `<div class="location-list">` or `<table>`
- **State:** `locations` (array of location objects)
- **Behavior:**
  - Displays each location with:
    - Location name
    - Number of children remaining (`childCount`)
    - List of children (name, security code, check-in time)
  - Sorted by child count (descending)
- **API Call:**
  - `GET /api/location-status?eventId={eventId}&date={date}`

### 3. **No Locations Message**
- **Element:** `<div class="no-locations">`
- **Behavior:**
  - Shows a message if there are no locations with remaining children

### 4. **Manual Refresh Button**
- **Element:** `<button class="refresh">`
- **Behavior:**
  - Allows user to manually refresh the list
  - Calls the same API as the polling

### 5. **Last Updated Indicator**
- **Element:** `<span class="last-updated">`
- **State:** `lastUpdated` (timestamp)
- **Behavior:**
  - Shows the last time the data was refreshed

---

## Business Logic & Flow

1. **On Page Load:**
   - Check authentication: `GET /api/auth-status`
   - If not authenticated, redirect to login
   - Load location status for current event/date

2. **Polling for Updates:**
   - Every 10 seconds, call `/api/location-status?eventId={eventId}&date={date}`
   - Update `locations` list and `lastUpdated`

3. **Manual Refresh:**
   - On button click, call `/api/location-status?eventId={eventId}&date={date}`
   - Update `locations` list and `lastUpdated`

4. **Sorting/Display:**
   - Sort locations by `childCount` (descending)
   - For each location, display all children with name, security code, and check-in time

5. **Error Handling:**
   - Show error message if API call fails
   - Retry on next polling interval

---

## API Call Reference

| Action                | Method | Endpoint                                         | Payload/Params                |
|-----------------------|--------|--------------------------------------------------|-------------------------------|
| Auth Status           | GET    | `/api/auth-status`                               | -                             |
| Get Location Status   | GET    | `/api/location-status?eventId={eventId}&date={date}` | -                        |

---

## Example UI Flow

1. **Location status page loads**
2. **Checks authentication**
3. **Fetches location status for event/date**
4. **Displays all locations with remaining children**
5. **Polls for updates every 10 seconds**
6. **Updates display in real time**
7. **Allows manual refresh**

---

## Notes for AI Implementation
- All API endpoints require authentication (session cookie)
- Polling for updates should be efficient (10s interval)
- UI should be readable and sortable by child count
- Show last updated time for transparency
- Provide feedback for manual refresh and errors
- Use semantic HTML and accessible components
- Follow the business logic and API contract exactly as described

---

This document provides a complete blueprint for reproducing the Location Status Page of the PCO Arrivals Billboard application, including all UI, business logic, and API interactions. 