/**
 * Sports Spots Membership System - Backend Server
 * Node.js/Express Backend for membership management
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Database file paths
const membersDBPath = path.join(__dirname, 'data', 'members.json');
const bookingsDBPath = path.join(__dirname, 'data', 'bookings.json');

// Initialize data directory and files
function initializeDatabase() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    if (!fs.existsSync(membersDBPath)) {
        fs.writeFileSync(membersDBPath, JSON.stringify([], null, 2));
    }

    if (!fs.existsSync(bookingsDBPath)) {
        fs.writeFileSync(bookingsDBPath, JSON.stringify([], null, 2));
    }
}

// Helper functions to read/write JSON files
function readMembers() {
    const data = fs.readFileSync(membersDBPath, 'utf8');
    return JSON.parse(data);
}

function writeMembers(data) {
    fs.writeFileSync(membersDBPath, JSON.stringify(data, null, 2));
}

function readBookings() {
    const data = fs.readFileSync(bookingsDBPath, 'utf8');
    return JSON.parse(data);
}

function writeBookings(data) {
    fs.writeFileSync(bookingsDBPath, JSON.stringify(data, null, 2));
}

// ============ MEMBERSHIP ENDPOINTS ============

/**
 * POST /api/membership/checkout
 * Process membership checkout
 */
app.post('/api/membership/checkout', (req, res) => {
    try {
        const {
            plan,
            fullName,
            email,
            phone,
            address,
            city,
            state,
            zipcode,
            country,
            cardName
        } = req.body;

        // Validation
        if (!fullName || !email || !phone || !plan) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if member already exists
        const members = readMembers();
        let memberExists = members.find(m => m.email === email);

        if (memberExists) {
            // Update existing membership
            const planPrice = plan === 'yearly' ? 30 : 10;
            memberExists.plan = plan;
            memberExists.status = 'active';
            memberExists.purchaseDate = new Date().toISOString();
            memberExists.renewalDate = calculateRenewalDate(plan);
            memberExists.phone = phone;
            memberExists.fullName = fullName;
            writeMembers(members);
        } else {
            // Create new member
            const newMember = {
                id: 'MEM-' + Date.now(),
                fullName,
                email,
                phone,
                address,
                city,
                state,
                zipcode,
                country,
                plan,
                status: 'active',
                purchaseDate: new Date().toISOString(),
                renewalDate: calculateRenewalDate(plan),
                discountPercentage: 20,
                totalBookings: 0,
                totalSavings: 0,
                createdAt: new Date().toISOString()
            };

            members.push(newMember);
            writeMembers(members);
        }

        // Simulate payment processing
        res.json({
            success: true,
            message: 'Membership activated successfully!',
            membershipId: 'MEM-' + Date.now(),
            email: email,
            plan: plan
        });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing checkout'
        });
    }
});

/**
 * GET /api/membership/:email
 * Get membership details for a user
 */
app.get('/api/membership/:email', (req, res) => {
    try {
        const { email } = req.params;
        const members = readMembers();
        const member = members.find(m => m.email === email);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        res.json({
            success: true,
            member: {
                id: member.id,
                fullName: member.fullName,
                email: member.email,
                phone: member.phone,
                plan: member.plan,
                status: member.status,
                purchaseDate: member.purchaseDate,
                renewalDate: member.renewalDate,
                discountPercentage: member.discountPercentage,
                totalBookings: member.totalBookings,
                totalSavings: member.totalSavings,
                createdAt: member.createdAt
            }
        });

    } catch (error) {
        console.error('Error fetching membership:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching membership'
        });
    }
});

/**
 * PUT /api/membership/:email
 * Update membership details
 */
app.put('/api/membership/:email', (req, res) => {
    try {
        const { email } = req.params;
        const { phone, fullName } = req.body;

        const members = readMembers();
        const member = members.find(m => m.email === email);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        if (phone) member.phone = phone;
        if (fullName) member.fullName = fullName;
        member.updatedAt = new Date().toISOString();

        writeMembers(members);

        res.json({
            success: true,
            message: 'Membership updated successfully'
        });

    } catch (error) {
        console.error('Error updating membership:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating membership'
        });
    }
});

/**
 * DELETE /api/membership/:email
 * Cancel membership
 */
app.delete('/api/membership/:email', (req, res) => {
    try {
        const { email } = req.params;
        let members = readMembers();

        members = members.map(m => {
            if (m.email === email) {
                m.status = 'cancelled';
                m.cancelledAt = new Date().toISOString();
            }
            return m;
        });

        writeMembers(members);

        res.json({
            success: true,
            message: 'Membership cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling membership:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cancelling membership'
        });
    }
});

/**
 * POST /api/membership/verify
 * Verify if user is an active member
 */
app.post('/api/membership/verify', (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                isActiveMember: false,
                message: 'Email required'
            });
        }

        const members = readMembers();
        const member = members.find(m => m.email === email);

        if (member && member.status === 'active') {
            res.json({
                success: true,
                isActiveMember: true,
                plan: member.plan,
                discountPercentage: member.discountPercentage
            });
        } else {
            res.json({
                success: true,
                isActiveMember: false
            });
        }

    } catch (error) {
        console.error('Error verifying membership:', error);
        res.status(500).json({
            success: false,
            isActiveMember: false,
            message: 'Server error verifying membership'
        });
    }
});

// ============ BOOKING ENDPOINTS ============

/**
 * POST /api/bookings
 * Create a new booking
 */
app.post('/api/bookings', (req, res) => {
    try {
        const {
            email,
            groundName,
            groundLocation,
            bookingDate,
            timeSlot,
            price
        } = req.body;

        // Verify member is active
        const members = readMembers();
        const member = members.find(m => m.email === email && m.status === 'active');

        if (!member) {
            return res.status(401).json({
                success: false,
                message: 'Member not active or not found'
            });
        }

        // Calculate discount
        const discount = (price * member.discountPercentage) / 100;
        const finalPrice = price - discount;

        // Create booking
        const booking = {
            id: 'BOOK-' + Date.now(),
            memberId: member.id,
            email: email,
            groundName,
            groundLocation,
            bookingDate,
            timeSlot,
            originalPrice: price,
            discount: discount,
            finalPrice: finalPrice,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        // Save booking
        const bookings = readBookings();
        bookings.push(booking);
        writeBookings(bookings);

        // Update member stats
        member.totalBookings = (member.totalBookings || 0) + 1;
        member.totalSavings = (member.totalSavings || 0) + discount;
        writeMembers(members);

        res.json({
            success: true,
            message: 'Booking confirmed with member discount!',
            booking: {
                id: booking.id,
                groundName,
                bookingDate,
                timeSlot,
                originalPrice,
                discountAmount: discount,
                finalPrice,
                discountPercentage: member.discountPercentage
            }
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating booking'
        });
    }
});

/**
 * GET /api/bookings/:email
 * Get all bookings for a member
 */
app.get('/api/bookings/:email', (req, res) => {
    try {
        const { email } = req.params;
        const bookings = readBookings();
        const memberBookings = bookings.filter(b => b.email === email);

        res.json({
            success: true,
            bookings: memberBookings,
            totalBookings: memberBookings.length
        });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching bookings'
        });
    }
});

/**
 * GET /api/members
 * Get all members (admin endpoint)
 */
app.get('/api/members', (req, res) => {
    try {
        const members = readMembers();
        res.json({
            success: true,
            totalMembers: members.length,
            members: members
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching members'
        });
    }
});

/**
 * GET /api/stats
 * Get membership statistics
 */
app.get('/api/stats', (req, res) => {
    try {
        const members = readMembers();
        const bookings = readBookings();

        const stats = {
            totalMembers: members.length,
            activeMembers: members.filter(m => m.status === 'active').length,
            monthlyMembers: members.filter(m => m.plan === 'monthly').length,
            yearlyMembers: members.filter(m => m.plan === 'yearly').length,
            totalBookings: bookings.length,
            totalRevenue: members.reduce((sum, m) => sum + (m.totalSavings || 0), 0),
            averageBookingsPerMember: Math.round(bookings.length / Math.max(members.length, 1))
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching stats'
        });
    }
});

// ============ UTILITY FUNCTIONS ============

function calculateRenewalDate(plan) {
    const renewalDate = new Date();
    if (plan === 'yearly') {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    } else {
        renewalDate.setMonth(renewalDate.getMonth() + 1);
    }
    return renewalDate.toISOString();
}

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// ============ START SERVER ============

// Initialize database
initializeDatabase();

// Start listening
app.listen(PORT, () => {
    console.log(`🚀 Sports Spots Membership Server running on port ${PORT}`);
    console.log(`📊 Database files created in /data directory`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  POST   /api/membership/checkout`);
    console.log(`  GET    /api/membership/:email`);
    console.log(`  PUT    /api/membership/:email`);
    console.log(`  DELETE /api/membership/:email`);
    console.log(`  POST   /api/membership/verify`);
    console.log(`  POST   /api/bookings`);
    console.log(`  GET    /api/bookings/:email`);
    console.log(`  GET    /api/members`);
    console.log(`  GET    /api/stats`);
});

module.exports = app;
