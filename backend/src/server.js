const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect DB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bases', require('./routes/bases'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
