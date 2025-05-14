const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - pcoId
 *         - name
 *         - email
 *       properties:
 *         pcoId:
 *           type: string
 *           description: Planning Center Online user ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         isAdmin:
 *           type: boolean
 *           description: Whether the user has admin privileges
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last login
 *   
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 */

/**
 * @swagger
 * /api/auth/login:
 *   get:
 *     summary: Initiates PCO OAuth login flow
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to PCO OAuth login page
 */
router.get('/login', (req, res) => {
  // Existing login logic
});

/**
 * @swagger
 * /api/auth/callback:
 *   get:
 *     summary: OAuth callback from PCO
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth authorization code
 *     responses:
 *       302:
 *         description: Redirects to application with successful login
 *       401:
 *         description: Unauthorized - Invalid callback code
 */
router.get('/callback', (req, res) => {
  // Existing callback logic
});

module.exports = router; 