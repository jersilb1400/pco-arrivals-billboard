const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Environment variables
const PCO_API_BASE = 'https://api.planningcenteronline.com/check-ins/v2';
const PCO_ACCESS_TOKEN = process.env.PCO_ACCESS_TOKEN;
const PCO_ACCESS_SECRET = process.env.PCO_ACCESS_SECRET;

/**
 * @swagger
 * components:
 *   schemas:
 *     CheckIn:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: PCO check-in ID
 *         name:
 *           type: string
 *           description: Person's name
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Check-in timestamp
 *         location:
 *           type: string
 *           description: Check-in location
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           description: Check-in status
 */

/**
 * @swagger
 * /api/billboard/check-ins:
 *   get:
 *     summary: Get active check-ins for a location
 *     tags: [Billboard]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         required: true
 *         description: PCO location ID to filter check-ins
 *     responses:
 *       200:
 *         description: List of active check-ins for the location
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CheckIn'
 *       401:
 *         description: Not authenticated
 */
router.get('/check-ins', requireAuth, async (req, res) => {
  try {
    const { locationId, eventId, date } = req.query;
    
    console.log(`[DEBUG] /api/billboard/check-ins called with locationId: ${locationId}, eventId: ${eventId}, date: ${date}`);

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Build the URL with date filter if provided
    let url = `${PCO_API_BASE}/events/${eventId}/check_ins?include=person,locations`;
    if (date) {
      // Add date filter to only get check-ins for the specific date
      url += `&where[created_at][gte]=${date}T00:00:00Z&where[created_at][lt]=${date}T23:59:59Z`;
    }
    
    console.log(`[DEBUG] Fetching check-ins from PCO with URL: ${url}`);
    
    // Fetch check-ins for the specific event
    const response = await axios.get(url, {
      auth: {
        username: PCO_ACCESS_TOKEN,
        password: PCO_ACCESS_SECRET
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    const checkIns = response.data.data;
    const included = response.data.included || [];

    console.log(`[DEBUG] Total check-ins returned from PCO for event ${eventId}${date ? ` on date ${date}` : ''}: ${checkIns.length}`);
    console.log(`[DEBUG] Total included items: ${included.length}`);
    console.log(`[DEBUG] Included types:`, included.map(item => item.type).filter((value, index, self) => self.indexOf(value) === index));

    // Log first few check-ins to see their structure
    if (checkIns.length > 0) {
      console.log(`[DEBUG] First check-in structure:`, JSON.stringify(checkIns[0], null, 2));
    }

    // Process check-ins for the specific event
    const eventCheckIns = [];
    let checkInsWithLocations = 0;
    let checkInsWithoutLocations = 0;

    checkIns.forEach((checkIn, index) => {
      // Only include active check-ins (not checked out)
      if (checkIn.attributes.checked_out_at) {
        return; // Skip checked out check-ins
      }

      const location = included.find(item =>
        item.type === 'Location' &&
        item.id === checkIn.relationships.locations?.data?.[0]?.id
      );
      const person = included.find(item => 
        item.type === 'Person' && 
        item.id === checkIn.relationships.person?.data?.id
      );
      
      if (person) {
        const checkInTimeRaw = checkIn.attributes.created_at;
        let checkInTime = '';
        if (checkInTimeRaw) {
          const dateObj = new Date(checkInTimeRaw);
          checkInTime = isNaN(dateObj.getTime()) ? '' : dateObj.toISOString();
        }
        const checkInData = {
          id: checkIn.id,
          name: `${person.attributes.first_name} ${person.attributes.last_name}`,
          securityCode: checkIn.attributes.security_code || '',
          checkInTime,
          locationName: location ? location.attributes.name : 'No Location Assigned',
          locationId: location ? location.id : null,
          eventName: checkIn.attributes.event_times_name || checkIn.attributes.event_name
        };
        
        eventCheckIns.push(checkInData);
        
        if (location) {
          checkInsWithLocations++;
        } else {
          checkInsWithoutLocations++;
        }
      } else {
        console.log(`[DEBUG] Check-in ${index} has no person data:`, checkIn.id);
      }
    });

    console.log(`[DEBUG] Active check-ins for event ${eventId}: ${eventCheckIns.length}`);
    console.log(`[DEBUG] Check-ins with locations: ${checkInsWithLocations}`);
    console.log(`[DEBUG] Check-ins without locations: ${checkInsWithoutLocations}`);

    // If locationId is provided, filter by location (but still show those without locations)
    if (locationId && locationId !== 'all') {
      const filteredCheckIns = eventCheckIns.filter(checkIn => 
        checkIn.locationId === locationId || checkIn.locationId === null
      );
      console.log(`[DEBUG] Filtered to ${filteredCheckIns.length} check-ins for locationId ${locationId} (including those without locations)`);
      res.json(filteredCheckIns);
    } else {
      // Return all active check-ins for the event
      console.log(`[DEBUG] Returning all ${eventCheckIns.length} active check-ins for event ${eventId}`);
      res.json(eventCheckIns);
    }
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

/**
 * @swagger
 * /api/billboard/stats:
 *   get:
 *     summary: Get check-in statistics
 *     tags: [Billboard]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Check-in statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalToday:
 *                   type: integer
 *                   description: Total check-ins today
 *                 byLocation:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   description: Check-ins count by location
 *                 byHour:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   description: Check-ins count by hour
 *       401:
 *         description: Not authenticated
 */
router.get('/stats', requireAuth, (req, res) => {
  // Existing stats logic
});

module.exports = router; 