const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookbuddy');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        location: {
          address: '1 Admin Plaza',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        preferences: {
          genres: ['Fiction', 'Non-Fiction', 'Technical'],
          languages: ['English'],
          exchangeRadius: 50
        }
      },
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123',
        location: {
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        preferences: {
          genres: ['Fiction', 'Mystery', 'Romance'],
          languages: ['English'],
          exchangeRadius: 10
        }
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123',
        location: {
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          coordinates: { lat: 34.0522, lng: -118.2437 }
        },
        preferences: {
          genres: ['Sci-Fi', 'Fantasy', 'Technical'],
          languages: ['English', 'Spanish'],
          exchangeRadius: 15
        }
      },
      {
        name: 'Carol Davis',
        email: 'carol@example.com',
        password: 'password123',
        location: {
          address: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          coordinates: { lat: 41.8781, lng: -87.6298 }
        },
        preferences: {
          genres: ['Biography', 'History', 'Self-Help'],
          languages: ['English'],
          exchangeRadius: 20
        }
      }
    ]);

    console.log('Created sample users');

    // Create sample books
    const books = await Book.create([
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0-7432-7356-5',
        genre: 'Fiction',
        condition: 'Good',
        description: 'A classic American novel about the Jazz Age',
        owner: users[1]._id,
        availabilityType: 'Exchange',
        status: 'Available',
        ageGroup: '15-18',
        tags: ['classic', 'american-literature', '1920s']
      },
      {
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: '978-0-441-17271-9',
        genre: 'Sci-Fi',
        condition: 'Very Good',
        description: 'Epic science fiction novel set in the distant future',
        owner: users[2]._id,
        availabilityType: 'Exchange',
        status: 'Available',
        ageGroup: '18+',
        tags: ['sci-fi', 'space', 'epic']
      },
      {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        isbn: '978-0-316-76948-0',
        genre: 'Fiction',
        condition: 'Fair',
        description: 'Coming-of-age story of Holden Caulfield',
        owner: users[1]._id,
        availabilityType: 'Free',
        status: 'Available',
        ageGroup: '15-18',
        tags: ['coming-of-age', 'classic']
      },
      {
        title: 'Steve Jobs',
        author: 'Walter Isaacson',
        isbn: '978-1-4516-4853-9',
        genre: 'Biography',
        condition: 'Like New',
        description: 'Biography of Apple co-founder Steve Jobs',
        owner: users[3]._id,
        availabilityType: 'Exchange',
        status: 'Available',
        ageGroup: '18+',
        tags: ['biography', 'technology', 'apple']
      },
      {
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        isbn: '978-0-544-00341-5',
        genre: 'Fantasy',
        condition: 'Good',
        description: 'Epic fantasy trilogy',
        owner: users[2]._id,
        availabilityType: 'Exchange',
        status: 'Available',
        ageGroup: '11-14',
        tags: ['fantasy', 'epic', 'trilogy']
      },
      {
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        isbn: '978-0-06-231609-7',
        genre: 'History',
        condition: 'Very Good',
        description: 'A brief history of humankind',
        owner: users[3]._id,
        availabilityType: 'Free',
        status: 'Available',
        ageGroup: '18+',
        tags: ['history', 'anthropology', 'evolution']
      }
    ]);

    console.log('Created sample books');

    console.log('Sample data seeded successfully!');
    console.log(`Created ${users.length} users and ${books.length} books`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;