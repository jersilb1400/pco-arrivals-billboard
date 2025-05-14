const express = require('express');
const router = express.Router();

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
 *     summary: Get recent check-ins
 *     tags: [Billboard]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of check-ins to return
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by check-in location
 *     responses:
 *       200:
 *         description: List of recent check-ins
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CheckIn'
 *       401:
 *         description: Not authenticated
 */
router.get('/check-ins', requireAuth, (req, res) => {
  // Existing check-ins logic
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