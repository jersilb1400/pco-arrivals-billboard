# PCO Arrivals Billboard - Simplified Usage

> **Note:** All routes (public and admin) are served from the backend service at your custom domain (e.g., https://arrivals.gracefm.org).

This system provides a streamlined way for volunteers to manage child pickup notifications using Planning Center Online (PCO) check-in data.

## How It Works

### 1. **Volunteer Check-In Station** (`/security-code-entry`)
- **Purpose**: Volunteers enter security codes that parents provide in person
- **Process**:
  1. Parent arrives and gives their security code to a volunteer
  2. Volunteer enters the security code into the system
  3. Child's name appears on the pickup billboard
  4. Pickup volunteers are notified to bring the child to the pickup area

### 2. **Pickup Billboard** (`/billboard`)
- **Purpose**: Display children ready for pickup on a TV/monitor
- **Shows**:
  - Child's name
  - Security code
  - Location where child is currently located
  - Time the pickup was requested
- **Auto-refreshes** every 30 seconds
- **Auto-cleanup** when children are checked out in PCO

### 3. **Location Status** (`/location-billboard`)
- **Purpose**: Overview of all locations with remaining children
- **Shows**:
  - All locations with active check-ins
  - Number of children in each location
  - Individual child details (name, security code, check-in time)
- **Sorted** by number of children (most first)
- **Auto-refreshes** every 30 seconds

## Workflow

1. **Check-In**: Children are checked in through PCO as usual
2. **Parent Arrival**: Parent arrives and gives security code to volunteer
3. **Code Entry**: Volunteer enters code at `/security-code-entry`
4. **Notification**: Child appears on pickup billboard
5. **Pickup**: Pickup volunteers see notification and bring child to pickup area
6. **Checkout**: Child is checked out in PCO
7. **Cleanup**: Notification automatically disappears from billboard

## Key Features

- **No Login Required**: Public pages for easy access
- **Real-time Updates**: Automatic refresh every 30 seconds
- **PCO Integration**: Direct connection to Planning Center Online
- **Automatic Cleanup**: Notifications removed when children are checked out
- **Mobile Friendly**: Responsive design for all devices
- **Rate Limit Protection**: Built-in protection against PCO API limits

## URLs

- **Check-In Station**: `https://arrivals.gracefm.org/security-code-entry`
- **Pickup Billboard**: `https://arrivals.gracefm.org/billboard`
- **Location Status**: `https://arrivals.gracefm.org/location-status`
- **Admin Panel**: `https://arrivals.gracefm.org/admin` (requires login)

## Setup

1. Configure PCO API credentials in server environment variables
2. Start the server: `npm start` (in server directory)
3. Start the client: `npm start` (in client directory)
4. Access the pages via the URLs above

## Notes

- The system automatically checks PCO every 2 minutes for checked-out children
- Notifications older than 10 minutes are automatically cleaned up
- All data is fetched directly from PCO - no local database required
- The system is designed for simplicity and reliability 