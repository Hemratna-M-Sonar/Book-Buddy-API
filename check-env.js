require('dotenv').config();

console.log('Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not Set');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE);

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set! Please check your .env file.');
} else {
  console.log('✅ JWT_SECRET is properly configured.');
}