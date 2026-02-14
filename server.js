require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Razorpay Client
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET'
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// ============ RAZORPAY ENDPOINTS ============

/**
 * POST /api/membership/create-order
 * Create a Razorpay order for membership
 */
app.post('/api/membership/create-order', async (req, res) => {
    try {
        const { plan, email } = req.body;
        
        const prices = {
            'monthly': 499,
            'pro-plus': 999,
            'yearly': 4999
        };
        
        const amount = (prices[plan] || 499) * 100; // in paise

        const options = {
            amount: amount,
            currency: "INR",
            receipt: `receipt_mem_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        
        res.json({
            success: true,
            order_id: order.id,
            amount: amount,
            key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_KEY_ID'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/membership/verify-payment
 * Verify Razorpay payment signature
 */
app.post('/api/membership/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/bookings/create-order
 * Create a Razorpay order for ground booking
 */
app.post('/api/bookings/create-order', async (req, res) => {
    try {
        const { amount } = req.body; // amount in INR
        
        const options = {
            amount: Math.round(amount * 100), // in paise
            currency: "INR",
            receipt: `receipt_book_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        
        res.json({
            success: true,
            order_id: order.id,
            amount: options.amount,
            key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_KEY_ID'
        });
    } catch (error) {
        console.error('Error creating booking order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/bookings/verify-payment
 * Verify Razorpay payment signature for bookings
 */
app.post('/api/bookings/verify-payment', (req, res) => {
    // Reuse the same logic as membership verification
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error('Error verifying booking payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ MEMBERSHIP ENDPOINTS ============

/**
 * POST /api/membership/checkout
 * Process membership checkout
 */
app.post('/api/membership/checkout', async (req, res) => {
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

        // Check if member already exists in Supabase
        const { data: existingMember, error: fetchError } = await supabase
            .from('memberships')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        const discountPercentage = plan === 'pro-plus' ? 20 : 10;
        const renewalDate = calculateRenewalDate(plan);

        if (existingMember) {
            // Update existing membership
            const { error: updateError } = await supabase
                .from('memberships')
                .update({
                    plan,
                    status: 'active',
                    discount_percentage: discountPercentage,
                    purchase_date: new Date().toISOString(),
                    renewal_date: renewalDate,
                    phone,
                    full_name: fullName,
                    updated_at: new Date().toISOString()
                })
                .eq('email', email);

            if (updateError) throw updateError;
        } else {
            // Create new member
            const { error: insertError } = await supabase
                .from('memberships')
                .insert([{
                    id: 'MEM-' + Date.now(),
                    full_name: fullName,
                    email,
                    phone,
                    address,
                    city,
                    state,
                    zipcode,
                    country,
                    plan,
                    status: 'active',
                    purchase_date: new Date().toISOString(),
                    renewal_date: renewalDate,
                    discount_percentage: discountPercentage,
                    total_bookings: 0,
                    total_savings: 0,
                    created_at: new Date().toISOString()
                }]);

            if (insertError) throw insertError;
        }

        res.json({
            success: true,
            message: 'Membership activated successfully!',
            email: email,
            plan: plan
        });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing checkout: ' + error.message
        });
    }
});

/**
 * GET /api/membership/:email
 * Get membership details for a user
 */
app.get('/api/membership/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { data: member, error } = await supabase
            .from('memberships')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error || !member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        res.json({
            success: true,
            member: {
                id: member.id,
                fullName: member.full_name,
                email: member.email,
                phone: member.phone,
                plan: member.plan,
                status: member.status,
                purchaseDate: member.purchase_date,
                renewalDate: member.renewal_date,
                discountPercentage: member.discount_percentage,
                totalBookings: member.total_bookings,
                totalSavings: member.total_savings,
                createdAt: member.created_at
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
app.put('/api/membership/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { phone, fullName } = req.body;

        const updateData = { updated_at: new Date().toISOString() };
        if (phone) updateData.phone = phone;
        if (fullName) updateData.full_name = fullName;

        const { error } = await supabase
            .from('memberships')
            .update(updateData)
            .eq('email', email);

        if (error) throw error;

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
app.delete('/api/membership/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { error } = await supabase
            .from('memberships')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('email', email);

        if (error) throw error;

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
app.post('/api/membership/verify', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                isActiveMember: false,
                message: 'Email required'
            });
        }

        const { data: member, error } = await supabase
            .from('memberships')
            .select('plan, status, discount_percentage')
            .eq('email', email)
            .maybeSingle();

        if (member && member.status === 'active') {
            res.json({
                success: true,
                isActiveMember: true,
                plan: member.plan,
                discountPercentage: member.discount_percentage
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
app.post('/api/bookings', async (req, res) => {
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
        const { data: member, error: memberError } = await supabase
            .from('memberships')
            .select('*')
            .eq('email', email)
            .eq('status', 'active')
            .maybeSingle();

        if (memberError || !member) {
            return res.status(401).json({
                success: false,
                message: 'Member not active or not found'
            });
        }

        // Calculate discount
        const discountPercentage = member.discount_percentage || 0;
        const discount = (price * discountPercentage) / 100;
        const finalPrice = price - discount;

        // Create booking
        const booking = {
            id: 'BOOK-' + Date.now(),
            member_id: member.id,
            email: email,
            ground_name: groundName,
            ground_location: groundLocation,
            booking_date: bookingDate,
            time_slot: timeSlot,
            original_price: price,
            discount: discount,
            final_price: finalPrice,
            status: 'confirmed',
            created_at: new Date().toISOString()
        };

        // Save booking to Supabase
        const { error: bookingError } = await supabase
            .from('bookings')
            .insert([booking]);

        if (bookingError) throw bookingError;

        // Update member stats
        const { error: updateError } = await supabase
            .from('memberships')
            .update({
                total_bookings: (member.total_bookings || 0) + 1,
                total_savings: (member.total_savings || 0) + discount,
                updated_at: new Date().toISOString()
            })
            .eq('email', email);

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: 'Booking confirmed with member discount!',
            booking: {
                id: booking.id,
                groundName,
                bookingDate,
                timeSlot,
                originalPrice: price,
                discountAmount: discount,
                finalPrice,
                discountPercentage: discountPercentage
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
app.get('/api/bookings/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('email', email);

        if (error) throw error;

        res.json({
            success: true,
            totalBookings: bookings.length,
            bookings: bookings.map(b => ({
                id: b.id,
                groundName: b.ground_name,
                groundLocation: b.ground_location,
                bookingDate: b.booking_date,
                timeSlot: b.time_slot,
                originalPrice: b.original_price,
                discount: b.discount,
                finalPrice: b.final_price,
                status: b.status,
                createdAt: b.created_at
            }))
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
app.get('/api/members', async (req, res) => {
    try {
        const { data: members, error } = await supabase
            .from('memberships')
            .select('*');

        if (error) throw error;

        res.json({
            success: true,
            totalMembers: members.length,
            members: members.map(m => ({
                id: m.id,
                fullName: m.full_name,
                email: m.email,
                phone: m.phone,
                plan: m.plan,
                status: m.status,
                purchaseDate: m.purchase_date,
                renewalDate: m.renewal_date,
                discountPercentage: m.discount_percentage,
                totalBookings: m.total_bookings,
                totalSavings: m.total_savings,
                createdAt: m.created_at
            }))
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
app.get('/api/stats', async (req, res) => {
    try {
        const { data: members, error: mError } = await supabase.from('memberships').select('*');
        const { data: bookings, error: bError } = await supabase.from('bookings').select('*');

        if (mError || bError) throw mError || bError;

        const stats = {
            totalMembers: members.length,
            activeMembers: members.filter(m => m.status === 'active').length,
            proMembers: members.filter(m => m.plan === 'pro').length,
            proPlusMembers: members.filter(m => m.plan === 'pro-plus').length,
            totalBookings: bookings.length,
            totalRevenue: members.reduce((sum, m) => sum + (Number(m.total_savings) || 0), 0),
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

// Start listening
app.listen(PORT, () => {
    console.log(`🚀 Sportify Spots Membership Server running on port ${PORT}`);
    console.log(`🔌 Connected to Supabase at ${supabaseUrl}`);
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
