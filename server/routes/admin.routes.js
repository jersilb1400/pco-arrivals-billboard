const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserInput:
 *       type: object
 *       required:
 *         - userId
 *         - name
 *         - email
 *       properties:
 *         userId:
 *           type: string
 *           description: PCO user ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Error status
 *         message:
 *           type: string
 *           description: Error message
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all authorized users
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of all authorized users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users', requireAuth, (req, res) => {
  // Existing get users logic
});

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Add a new authorized user
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - Admin access required
 */
router.post('/users', requireAuth, (req, res) => {
  // Existing add user logic
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Remove an authorized user
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: User successfully removed
 *       400:
 *         description: Cannot remove own account
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - Admin access required
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', requireAuth, (req, res) => {
  // Existing delete user logic
});

module.exports = router; 