const express = require('express');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getMyBooks,
  rateBook,
  getRecommendations
} = require('../controllers/bookController');
const auth = require('../middleware/auth');
const { validate, createBookSchema, updateBookSchema } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book management endpoints
 */

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all available books
 *     tags: [Books]
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
 *           default: 12
 *         description: Number of books per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title, author, or description
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *         description: Filter by condition
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by exchange type
 *     responses:
 *       200:
 *         description: List of books
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
 *                     books:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
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
 *     summary: Create a new book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - genre
 *               - condition
 *             properties:
 *               title:
 *                 type: string
 *                 example: The Great Gatsby
 *               author:
 *                 type: string
 *                 example: F. Scott Fitzgerald
 *               isbn:
 *                 type: string
 *                 example: 978-0-7432-7356-5
 *               genre:
 *                 type: string
 *                 enum: [Fiction, Non-Fiction, Mystery, Romance, Sci-Fi, Fantasy, Biography, History, Self-Help, Technical, Other]
 *                 example: Fiction
 *               language:
 *                 type: string
 *                 default: English
 *               condition:
 *                 type: string
 *                 enum: [New, Like New, Very Good, Good, Fair, Poor]
 *                 example: Good
 *               description:
 *                 type: string
 *                 example: A classic American novel
 *               availabilityType:
 *                 type: string
 *                 enum: [Free, Exchange]
 *                 default: Exchange
 *               status:
 *                 type: string
 *                 enum: [Available, Not Available]
 *                 default: Available
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Book created successfully
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
 *                   example: Book created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       $ref: '#/components/schemas/Book'
 */
router.route('/')
  .get(getBooks)
  .post(auth, validate(createBookSchema), createBook);

/**
 * @swagger
 * /api/books/my-books:
 *   get:
 *     summary: Get current user's books
 *     tags: [Books]
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
 *           default: 12
 *         description: Number of books per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by availability status
 *     responses:
 *       200:
 *         description: User's books
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
 *                     books:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
 *                     pagination:
 *                       type: object
 */
router.get('/my-books', auth, getMyBooks);

/**
 * @swagger
 * /api/books/recommendations:
 *   get:
 *     summary: Get book recommendations for current user
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Book recommendations
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
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
 */
router.get('/recommendations', auth, getRecommendations);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book details
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
 *                     book:
 *                       $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 *   put:
 *     summary: Update book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               isbn:
 *                 type: string
 *               genre:
 *                 type: string
 *               language:
 *                 type: string
 *               condition:
 *                 type: string
 *               description:
 *                 type: string
 *               availabilityType:
 *                 type: string
 *                 enum: [Free, Exchange]
 *               status:
 *                 type: string
 *                 enum: [Available, Not Available]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       403:
 *         description: Not authorized to update this book
 *       404:
 *         description: Book not found
 *   delete:
 *     summary: Delete book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       403:
 *         description: Not authorized to delete this book
 *       404:
 *         description: Book not found
 */
router.route('/:id')
  .get(getBookById)
  .put(auth, validate(updateBookSchema), updateBook)
  .delete(auth, deleteBook);

/**
 * @swagger
 * /api/books/{id}/rate:
 *   post:
 *     summary: Rate a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
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
 *                 example: 4
 *     responses:
 *       200:
 *         description: Book rated successfully
 *       400:
 *         description: Invalid rating or not authorized to rate
 *       404:
 *         description: Book not found
 */
router.post('/:id/rate', auth, rateBook);

module.exports = router;