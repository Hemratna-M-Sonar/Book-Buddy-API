const express = require('express');
const {
  getAdminDashboard,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllBooks,
  updateBook,
  deleteBook,
  getAllRequests,
  updateRequest,
  createAdmin
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleAuth');
const { validate, registerSchema } = require('../middleware/validation');

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(auth);
router.use(adminOnly);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints for managing the platform
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         activeUsers:
 *                           type: integer
 *                         totalBooks:
 *                           type: integer
 *                         availableBooks:
 *                           type: integer
 *                         totalRequests:
 *                           type: integer
 *                         pendingRequests:
 *                           type: integer
 *                         completedRequests:
 *                           type: integer
 *                     monthlyStats:
 *                       type: object
 *                     recentActivity:
 *                       type: object
 *       403:
 *         description: Access denied - Admin privileges required
 */
router.get('/dashboard', getAdminDashboard);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Access denied - Admin privileges required
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user role or status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied - Admin privileges required
 *   delete:
 *     summary: Deactivate user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied - Admin privileges required
 */
router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

/**
 * @swagger
 * /api/admin/books:
 *   get:
 *     summary: Get all books (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or author
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [available, requested, exchanged, unavailable]
 *     responses:
 *       200:
 *         description: List of all books
 *       403:
 *         description: Access denied - Admin privileges required
 */
router.get('/books', getAllBooks);

/**
 * @swagger
 * /api/admin/books/{id}:
 *   put:
 *     summary: Update book status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *               availability:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [available, requested, exchanged, unavailable]
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       404:
 *         description: Book not found
 *       403:
 *         description: Access denied - Admin privileges required
 *   delete:
 *     summary: Delete book
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 *       403:
 *         description: Access denied - Admin privileges required
 */
router.route('/books/:id')
  .put(updateBook)
  .delete(deleteBook);

/**
 * @swagger
 * /api/admin/requests:
 *   get:
 *     summary: Get all requests (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, completed, cancelled]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [exchange, lend, buy, gift]
 *     responses:
 *       200:
 *         description: List of all requests
 *       403:
 *         description: Access denied - Admin privileges required
 */
router.get('/requests', getAllRequests);

/**
 * @swagger
 * /api/admin/requests/{id}:
 *   put:
 *     summary: Update request status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected, completed, cancelled]
 *     responses:
 *       200:
 *         description: Request updated successfully
 *       404:
 *         description: Request not found
 *       403:
 *         description: Access denied - Admin privileges required
 */
router.put('/requests/:id', updateRequest);

/**
 * @swagger
 * /api/admin/create-admin:
 *   post:
 *     summary: Create new admin user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin User
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: adminpassword123
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *       400:
 *         description: User already exists or validation error
 *       403:
 *         description: Access denied - Admin privileges required
 */
router.post('/create-admin', validate(registerSchema), createAdmin);

module.exports = router;