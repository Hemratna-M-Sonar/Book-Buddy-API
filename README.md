# Book Buddy API

A comprehensive RESTful API for a book sharing and exchange platform built with Node.js, Express, and MongoDB.


## NOTE

Added some more feild in schema for future scope,as of NOW in  ROLE MIDDLEWARE we are using only adminonly middleware for admin routes,also there are different roles middleware created for future scopes.

## Features

- **User Management**: Registration, authentication, profile management
- **Book Management**: CRUD operations for books with detailed metadata
- **Request System**: Exchange, lending, buying, and gifting requests (lending/buying future scope)
- **Rating System**: Rate books and users after exchanges
- **Search & Discovery**: Advanced search and filtering capabilities
- **Dashboard**: User statistics and activity tracking
- **Security**: JWT authentication, input validation, rate limiting

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd book-buddy-api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bookbuddy
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
```

5. Start MongoDB service on your machine

6. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3000/api-docs`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/password` - Update password

### Users
- `GET /api/users` - Get all users (with search and filters)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Get user dashboard data
- `DELETE /api/users/account` - Deactivate account

### Books
- `GET /api/books` - Get all available books (with search and filters)
- `POST /api/books` - Create a new book
- `GET /api/books/:id` - Get book by ID
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `GET /api/books/my-books` - Get current user's books
- `GET /api/books/recommendations` - Get book recommendations
- `POST /api/books/:id/rate` - Rate a book

### Requests
- `GET /api/requests` - Get all requests (sent and received)
- `POST /api/requests` - Create a new request
- `GET /api/requests/:id` - Get request by ID
- `PUT /api/requests/:id` - Update request status
- `DELETE /api/requests/:id` - Delete request
- `POST /api/requests/:id/rate` - Rate a completed request

## Data Models

### User
- Personal information (name, email, location)
- Preferences (genres, languages, exchange radius)
- Rating system
- Account status

### Book
- Book details (title, author, ISBN, genre, condition)
- Availability status and preferences
- Exchange preferences (type, duration, price)
- Images and tags
- Rating system

### Request
- Request details (type, message, status)
- Offered books (for exchanges)
- Meeting details
- Rating and review system

## Request Types

1. **Exchange**: Trade books with other users
2. **Lend**: Borrow books for a specific duration
3. **Buy**: Purchase books from other users
4. **Gift**: Receive books as gifts

## Request Status Flow

1. **Pending**: Initial state when request is created
2. **Accepted**: Owner accepts the request
3. **Rejected**: Owner rejects the request
4. **Completed**: Exchange/transaction is completed
5. **Cancelled**: Request is cancelled by requester

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS protection
- Security headers with Helmet

## Error Handling

The API uses consistent error response format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Testing

Run tests with:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request



## Support

For support and questions, please contact.

