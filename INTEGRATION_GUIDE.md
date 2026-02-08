# Membership System - Integration Guide

## 🎯 Quick Start

### 1. Install & Start Backend

**Windows:**
```
Double-click: setup.bat
Then run: npm start
```

**Mac/Linux:**
```bash
bash setup.sh
npm start
```

**Or manually:**
```bash
npm install
npm start
```

The server will start on `http://localhost:5000`

### 2. Access Frontend

Open in browser:
- Home page: `http://localhost:8000/index.html` (or your server URL)
- Membership plans: `http://localhost:8000/membership.html`

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Users/Customers                       │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │      Frontend Pages (HTML/CSS/JS)    │
        ├──────────────────────────────────────┤
        │ • membership.html                    │
        │ • membership-checkout.html           │
        │ • membership-dashboard.html          │
        └──────────┬───────────────────────────┘
                   │ API Calls (HTTP/JSON)
                   ▼
        ┌──────────────────────────────────────┐
        │   Backend Server (Node.js/Express)   │
        ├──────────────────────────────────────┤
        │ • /api/membership/* endpoints        │
        │ • /api/bookings/* endpoints          │
        │ • /api/members endpoint              │
        │ • /api/stats endpoint                │
        └──────────┬───────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │         Local JSON Databases         │
        ├──────────────────────────────────────┤
        │ • data/members.json                  │
        │ • data/bookings.json                 │
        └──────────────────────────────────────┘
```

---

## 🔄 User Journey

### Step 1: Browse Membership Plans
User visits `membership.html` and sees:
- Monthly Plan ($10/month)
- Yearly Plan ($30/year) - Highlighted as popular
- Benefits list
- "Choose Plan" buttons

### Step 2: Checkout
User clicks "Choose Plan" and goes to `membership-checkout.html`:
1. Fills personal information
2. Fills billing address
3. Enters payment details (demo only)
4. Clicks "Complete Purchase"

### Step 3: Backend Processing
Server receives request to `/api/membership/checkout`:
1. Validates all required fields
2. Checks if email already exists (update or create)
3. Saves member to `data/members.json`
4. Calculates renewal date
5. Returns success response

### Step 4: Dashboard Access
User redirected to `membership-dashboard.html`:
1. Displays membership status and plan
2. Shows member benefits
3. Shows recent bookings with discounts applied
4. Displays total savings
5. Allows membership management

---

## 🛠️ Integration Points

### 1. With Existing Login System

**Add this to your login.html / login process:**

```javascript
// After successful login
fetch('/api/membership/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail })
})
.then(res => res.json())
.then(data => {
    if (data.isActiveMember) {
        // Show member badge
        document.getElementById('memberBadge').style.display = 'block';
        // Store member info
        sessionStorage.setItem('isMember', 'true');
        sessionStorage.setItem('discount', data.discountPercentage);
    }
});
```

### 2. With Booking System

**When user books a ground:**

```javascript
// Check if user is member
const isMember = sessionStorage.getItem('isMember') === 'true';
const discountPercentage = sessionStorage.getItem('discount') || 0;

// Calculate price with discount
const basePrice = 1500;
const discount = isMember ? (basePrice * discountPercentage / 100) : 0;
const finalPrice = basePrice - discount;

// Create booking with member discount
fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: userEmail,
        groundName: 'Elite Cricket Ground',
        groundLocation: 'Chennai',
        bookingDate: '2026-02-10',
        timeSlot: '4:00 PM - 5:00 PM',
        price: basePrice
    })
});
```

### 3. With Header/Navigation

**Update your navigation to include membership link:**

```html
<nav>
    <a href="index.html">Home</a>
    <a href="grounds.html">Grounds</a>
    <a href="membership.html" style="color: #667eea; font-weight: bold;">💎 Membership</a>
    <a href="services.html">Service</a>
    <a href="login.html" class="btn">Login</a>
    <a href="signup.html" class="btn-outline">Sign Up</a>
</nav>
```

---

## 📱 File Locations Reference

```
d:\website\ground booking\
├── index.html                    ← Updated with membership link
├── membership.html               ← NEW: Membership plans page
├── membership-checkout.html      ← NEW: Checkout page
├── membership-dashboard.html     ← NEW: Member dashboard
├── server.js                     ← NEW: Backend server
├── package.json                  ← NEW: Node dependencies
├── setup.bat                     ← NEW: Windows setup script
├── setup.sh                      ← NEW: Mac/Linux setup script
├── test.js                       ← NEW: API test script
├── MEMBERSHIP_README.md          ← NEW: Full documentation
├── INTEGRATION_GUIDE.md          ← NEW: This file
├── css/
│   └── auth.css
├── grounds.html
├── ground-details.html
├── user-home.html
└── ... (other files)
```

---

## 🧪 Testing the System

### Manual Testing

1. **Start server:**
   ```bash
   npm start
   ```

2. **Open browser:**
   ```
   http://localhost:8000/membership.html
   ```

3. **Test flow:**
   - Click "Choose Plan" (Monthly or Yearly)
   - Fill checkout form with test data
   - Click "Complete Purchase"
   - Verify redirect to dashboard
   - Check member details display

### Automated Testing

```bash
npm test
```

This will test all API endpoints and show results.

---

## 🔧 Configuration

### Change Port

Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000;  // Change 5000 to 3000
```

Or set environment variable:
```bash
set PORT=3000  # Windows
export PORT=3000  # Mac/Linux
npm start
```

### Change API Base URL

In HTML files (membership-checkout.html):
```javascript
const apiUrl = 'http://your-domain.com:5000';  // Update this
fetch(apiUrl + '/api/membership/checkout', ...)
```

---

## 🚀 Production Deployment

### Before Going Live

1. **Move from JSON to Database:**
   - Replace JSON files with PostgreSQL/MongoDB
   - Update server.js to use database drivers

2. **Add Real Payment Processing:**
   - Integrate Stripe/PayPal API
   - Remove demo payment handling

3. **Security:**
   - Add JWT authentication
   - Encrypt sensitive data
   - Implement HTTPS
   - Add rate limiting
   - Validate all inputs

4. **Testing:**
   - Write comprehensive unit tests
   - Test all API endpoints
   - Test error scenarios
   - Load test the server

5. **Monitoring:**
   - Set up error logging
   - Monitor API performance
   - Track member statistics

---

## 🆘 Common Issues & Solutions

### Issue: Server won't start
```bash
# Solution 1: Check if port 5000 is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # Mac/Linux

# Solution 2: Use different port
set PORT=8001
npm start
```

### Issue: CORS errors in browser
```javascript
// Add CORS headers to server.js
app.use(cors({
    origin: 'http://localhost:8000',
    credentials: true
}));
```

### Issue: Can't find module
```bash
# Solution: Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: Data not persisting
```bash
# Check if data/ directory exists
# Server creates it automatically, but check permissions
chmod 755 data/
```

---

## 📞 Support & Resources

- **Express.js**: https://expressjs.com/
- **Node.js**: https://nodejs.org/
- **REST API Best Practices**: https://restfulapi.net/
- **JSON Data Format**: https://www.json.org/

---

## ✅ Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Backend server running (`npm start`)
- [ ] Frontend files accessible
- [ ] Can access membership.html
- [ ] Can navigate to checkout
- [ ] Checkout form validates
- [ ] Can complete purchase
- [ ] Dashboard loads after purchase
- [ ] API endpoints respond correctly
- [ ] Data saved to JSON files
- [ ] Tests pass (`npm test`)

---

**Version**: 1.0.0  
**Last Updated**: February 3, 2026
