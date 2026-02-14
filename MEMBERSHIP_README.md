# Sports Spots Membership System

Complete membership management system for the Sports Spots ground booking platform.

## 📋 Features

### Membership Plans
- **Monthly Plan**: $10/month
- **Annual Plan**: $30/year (Save 75%)

### Member Benefits
- 10-20% discount on all ground bookings
- Priority booking access to peak time slots
- Priority email & chat support
- Flexible cancellation anytime
- Exclusive member-only events
- Complete booking history and statistics

## 📁 Files Structure

### Frontend Pages
```
membership.html                 - Membership plans display page
membership-checkout.html        - Enrollment and payment page
membership-dashboard.html       - Member dashboard and account management
```

### Backend Files
```
server.js                      - Express.js backend server
package.json                   - Node.js dependencies
data/members.json             - Members database (auto-created)
data/bookings.json            - Bookings database (auto-created)
```

## 🚀 Installation & Setup

### Backend Setup

1. **Install Node.js dependencies:**
```bash
npm install
```

2. **Start the backend server:**
```bash
npm start
```

The server will start on `http://localhost:5000`

For development with auto-reload:
```bash
npm run dev
```

### Frontend Setup

1. **Update API URLs in HTML files:**

Replace `localhost:5000` with your server URL in:
- `membership-checkout.html` (line with `/api/membership/checkout`)
- Any other files that make API calls

2. **Serve the frontend files:**

Using Node.js:
```bash
npx http-server
```

Or use any web server of your choice.

## 🔌 API Endpoints

### Membership Endpoints

#### Create/Update Membership
```
POST /api/membership/checkout
Content-Type: application/json

{
  "plan": "monthly" | "yearly",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipcode": "10001",
  "country": "USA",
  "cardName": "John Doe"
}

Response:
{
  "success": true,
  "message": "Membership activated successfully!",
  "membershipId": "MEM-1701234567890",
  "email": "john@example.com",
  "plan": "yearly"
}
```

#### Get Membership Details
```
GET /api/membership/:email

Response:
{
  "success": true,
  "member": {
    "id": "MEM-123456",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "plan": "yearly",
    "status": "active",
    "purchaseDate": "2026-02-03T12:00:00Z",
    "renewalDate": "2027-02-03T12:00:00Z",
    "discountPercentage": 10 | 20,
    "totalBookings": 12,
    "totalSavings": 2400
  }
}
```

#### Update Membership
```
PUT /api/membership/:email
Content-Type: application/json

{
  "phone": "+9876543210",
  "fullName": "Jane Doe"
}

Response:
{
  "success": true,
  "message": "Membership updated successfully"
}
```

#### Cancel Membership
```
DELETE /api/membership/:email

Response:
{
  "success": true,
  "message": "Membership cancelled successfully"
}
```

#### Verify Membership
```
POST /api/membership/verify
Content-Type: application/json

{
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "isActiveMember": true,
  "plan": "yearly",
  "discountPercentage": 10 | 20
}
```

### Booking Endpoints

#### Create Booking (with Member Discount)
```
POST /api/bookings
Content-Type: application/json

{
  "email": "john@example.com",
  "groundName": "Elite Cricket Ground",
  "groundLocation": "Chennai",
  "bookingDate": "2026-02-10",
  "timeSlot": "4:00 PM - 5:00 PM",
  "price": 1500
}

Response:
{
  "success": true,
  "message": "Booking confirmed with member discount!",
  "booking": {
    "id": "BOOK-1701234567890",
    "groundName": "Elite Cricket Ground",
    "bookingDate": "2026-02-10",
    "timeSlot": "4:00 PM - 5:00 PM",
    "originalPrice": 1500,
    "discountAmount": 300,
    "finalPrice": 1200,
    "discountPercentage": 10 | 20
  }
}
```

#### Get Member Bookings
```
GET /api/bookings/:email

Response:
{
  "success": true,
  "bookings": [
    {
      "id": "BOOK-123456",
      "groundName": "Elite Cricket Ground",
      "bookingDate": "2026-02-10",
      "timeSlot": "4:00 PM - 5:00 PM",
      "originalPrice": 1500,
      "discount": 300,
      "finalPrice": 1200,
      "status": "confirmed",
      "createdAt": "2026-02-03T12:00:00Z"
    }
  ],
  "totalBookings": 1
}
```

### Admin Endpoints

#### Get All Members
```
GET /api/members

Response:
{
  "success": true,
  "totalMembers": 15,
  "members": [...]
}
```

#### Get Statistics
```
GET /api/stats

Response:
{
  "success": true,
  "stats": {
    "totalMembers": 50,
    "activeMembers": 45,
    "monthlyMembers": 20,
    "yearlyMembers": 25,
    "totalBookings": 150,
    "totalRevenue": 12000,
    "averageBookingsPerMember": 3
  }
}
```

## 💾 Database Schema

### members.json
```json
{
  "id": "MEM-1701234567890",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipcode": "10001",
  "country": "USA",
  "plan": "yearly",
  "status": "active",
  "purchaseDate": "2026-02-03T12:00:00Z",
  "renewalDate": "2027-02-03T12:00:00Z",
  "discountPercentage": 10 | 20,
  "totalBookings": 12,
  "totalSavings": 2400,
  "createdAt": "2026-02-03T12:00:00Z",
  "updatedAt": "2026-02-03T12:00:00Z"
}
```

### bookings.json
```json
{
  "id": "BOOK-1701234567890",
  "memberId": "MEM-1701234567890",
  "email": "john@example.com",
  "groundName": "Elite Cricket Ground",
  "groundLocation": "Chennai",
  "bookingDate": "2026-02-10",
  "timeSlot": "4:00 PM - 5:00 PM",
  "originalPrice": 1500,
  "discount": 300,
  "finalPrice": 1200,
  "status": "confirmed",
  "createdAt": "2026-02-03T12:00:00Z"
}
```

## 🔐 Security Considerations

### Current Implementation (Demo)
- Payment information is NOT actually processed or stored
- Uses in-memory JSON files for storage
- No encryption of sensitive data

### For Production Use
1. **Use a Real Payment Processor**: Integrate with Stripe, PayPal, or similar
2. **Database**: Migrate from JSON files to PostgreSQL/MongoDB
3. **Authentication**: Implement JWT tokens or OAuth
4. **Encryption**: Encrypt sensitive data at rest and in transit
5. **HTTPS**: Always use HTTPS in production
6. **Rate Limiting**: Add API rate limiting
7. **Input Validation**: Implement comprehensive input validation
8. **CORS Policy**: Configure CORS properly for your domain only

## 📝 Usage Examples

### JavaScript/Fetch
```javascript
// Create a membership
const response = await fetch('/api/membership/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan: 'yearly',
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipcode: '10001',
    country: 'USA',
    cardName: 'John Doe'
  })
});

const data = await response.json();
console.log(data);
```

### cURL
```bash
curl -X POST http://localhost:5000/api/membership/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "monthly",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipcode": "10001",
    "country": "USA",
    "cardName": "John Doe"
  }'
```

## 🧪 Testing

The system includes sample data in the dashboards. To test:

1. Visit `membership.html` to view plans
2. Click "Choose Plan" to go to checkout
3. Fill the form with test data
4. Click "Complete Purchase"
5. You'll be redirected to the member dashboard
6. View your bookings and savings

## 🐛 Troubleshooting

### Server won't start
- Check if port 5000 is already in use
- Ensure Node.js is installed (`node --version`)
- Run `npm install` to install dependencies

### API calls failing
- Check server is running on `http://localhost:5000`
- Check CORS settings match your frontend URL
- Check browser console for error messages

### Database files not created
- Server automatically creates `/data` directory
- Ensure write permissions in the project directory

## 🛠️ Future Enhancements

- [ ] Email verification for new members
- [ ] Automatic invoice generation
- [ ] SMS notifications for bookings
- [ ] Referral program for members
- [ ] Tiered membership benefits
- [ ] Mobile app integration
- [ ] Payment gateway integration
- [ ] Admin panel for member management
- [ ] Usage analytics and reports
- [ ] Automated membership renewal reminders

## 📞 Support

For issues or questions, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: February 3, 2026  
**License**: MIT
