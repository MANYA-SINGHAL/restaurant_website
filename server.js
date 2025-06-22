// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files (your HTML/CSS/JS)

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Reservation Schema
const reservationSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    partySize: {
        type: Number,
        required: true,
        min: 1,
        max: 20
    },
    occasion: {
        type: String,
        required: true,
        enum: ['date', 'family_gathering', 'birthday', 'kitty_party', 'friends_meetup', 'other']
    },
    reservationDate: {
        type: Date,
        required: true
    },
    reservationTime: {
        type: String,
        required: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
  },
    specialRequests: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// Routes

// Serve the reservation form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reserve1.html'));
});

// Alternative route for reservation form
app.get('/reservation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reserve1.html'));
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Create a new reservation
app.post('/api/reservations', async (req, res) => {
    try {
      console.log('=== DEBUGGING ===');
      console.log('Received request body:', req.body);
      console.log('Content-Type:', req.headers['content-type']);
      
        const {
            first_name,
            last_name,
            email,
            party_size,
            occasion,
            reservation_date,
            reservation_time,
            phone,
            special_requests
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email || !phone || !party_size || !occasion || !reservation_date || !reservation_time) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        // Check if the date is not in the past
        const reservationDate = new Date(reservation_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (reservationDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Reservation date cannot be in the past'
            });
        }

        // Check for duplicate reservations (same email, date, and time)
        const existingReservation = await Reservation.findOne({
            email: email.toLowerCase(),
            reservationDate: reservationDate,
            reservationTime: reservation_time,
            status: { $ne: 'cancelled' }
        });

        if (existingReservation) {
            return res.status(400).json({
                success: false,
                message: 'A reservation already exists for this email at the same date and time'
            });
        }

      // Add email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
           return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
          });
}

     // Add phone validation
     const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
     if (!phoneRegex.test(phone)) {
           return res.status(400).json({
                success: false,
                message: 'Please provide a valid phone number'
          });
}

        // Create new reservation
        const newReservation = new Reservation({
            firstName: first_name,
            lastName: last_name,
            email: email.toLowerCase(),
            partySize: parseInt(party_size),
            occasion,
            reservationDate: reservationDate,
            reservationTime: reservation_time,
            phone,
            specialRequests: special_requests || ''
        });

        const savedReservation = await newReservation.save();

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully!',
            reservation: {
                id: savedReservation._id,
                name: `${savedReservation.firstName} ${savedReservation.lastName}`,
                email: savedReservation.email,
                date: savedReservation.reservationDate,
                time: savedReservation.reservationTime,
                partySize: savedReservation.partySize,
                occasion: savedReservation.occasion
            }
        });

    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all reservations (for admin)
app.get('/api/reservations', async (req, res) => {
    try {
        const { status, date } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (date) {
            const searchDate = new Date(date);
            query.reservationDate = {
                $gte: searchDate,
                $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000)
            };
        }

        const reservations = await Reservation.find(query)
            .sort({ reservationDate: 1, reservationTime: 1 });

        res.json({
            success: true,
            reservations
        });

    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get a specific reservation
app.get('/api/reservations/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        res.json({
            success: true,
            reservation
        });

    } catch (error) {
        console.error('Error fetching reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update reservation status
app.patch('/api/reservations/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        res.json({
            success: true,
            message: 'Reservation status updated successfully',
            reservation
        });

    } catch (error) {
        console.error('Error updating reservation status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete reservation
app.delete('/api/reservations/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.id);
        
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        res.json({
            success: true,
            message: 'Reservation deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;