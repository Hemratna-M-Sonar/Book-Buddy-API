const express = require('express');
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  rateRequest,
  deleteRequest
} = require('../controllers/requestController');
const auth = require('../middleware/auth');
const { validate, createRequestSchema, updateRequestSchema, rateRequestSchema } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Requests
 *   description: Book exchange request endpoints
 */

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get all requests (sent and received)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of requests per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, completed]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sent, received]
 *         description: Filter by request type (sent or received)
 *     responses:
 *       200:
 *         description: List of requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Request'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *   post:
 *     summary: Create a new request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - book
 *               - type
 *             properties:
 *               book:
 *                 type: string
 *                 description: Book ID
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *               type:
 *                 type: string
 *                 enum: [free, exchange]
 *                 example: exchange
 *               offeredBooks:
 *                 type: string
 *                 description: Book ID offered in exchange (required for exchange type)
 *     responses:
 *       201:
 *         description: Request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Request created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     request:
 *                       $ref: '#/components/schemas/Request'
 *       400:
 *         description: Invalid request data or book not available
 *       404:
 *         description: Book not found
 */
router.route('/')
  .get(auth, getRequests)
  .post(auth, validate(createRequestSchema), createRequest);

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Get request by ID
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     request:
 *                       $ref: '#/components/schemas/Request'
 *       403:
 *         description: Not authorized to view this request
 *       404:
 *         description: Request not found
 *   put:
 *     summary: Update request status
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, completed]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Request accepted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     request:
 *                       $ref: '#/components/schemas/Request'
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Not authorized to update this request
 *       404:
 *         description: Request not found
 *   delete:
 *     summary: Delete request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request deleted successfully
 *       400:
 *         description: Cannot delete request in current status
 *       403:
 *         description: Not authorized to delete this request
 *       404:
 *         description: Request not found
 */
router.route('/:id')
  .get(auth, getRequestById)
  .put(auth, validate(updateRequestSchema), updateRequest)
  .delete(auth, deleteRequest);

/**
 * @swagger
 * /api/requests/{id}/rate:
 *   post:
 *     summary: Rate a completed request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               review:
 *                 type: string
 *                 maxLength: 500
 *                 example: Great experience! Very reliable person.
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Rating submitted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     rating:
 *                       type: object
 *       400:
 *         description: Request not completed or already rated
 *       403:
 *         description: Not authorized to rate this request
 *       404:
 *         description: Request not found
 */
router.post('/:id/rate', auth, validate(rateRequestSchema), rateRequest);

module.exports = router;