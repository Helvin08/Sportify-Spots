/**
 * Test file for Membership API
 * Run with: node test.js
 */

const http = require('http');

// Test helper function
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    resolve(responseData);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Run tests
async function runTests() {
    console.log('🧪 Starting Membership System Tests...\n');

    try {
        // Test 1: Create membership
        console.log('📝 Test 1: Creating membership...');
        const checkoutResult = await makeRequest('POST', '/api/membership/checkout', {
            plan: 'yearly',
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '+1234567890',
            address: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipcode: '12345',
            country: 'USA',
            cardName: 'Test User'
        });
        console.log('✓ Result:', checkoutResult);
        console.log('');

        // Test 2: Get membership
        console.log('📝 Test 2: Retrieving membership...');
        const membershipResult = await makeRequest('GET', '/api/membership/test@example.com');
        console.log('✓ Result:', membershipResult);
        console.log('');

        // Test 3: Verify membership
        console.log('📝 Test 3: Verifying membership...');
        const verifyResult = await makeRequest('POST', '/api/membership/verify', {
            email: 'test@example.com'
        });
        console.log('✓ Result:', verifyResult);
        console.log('');

        // Test 4: Create booking
        console.log('📝 Test 4: Creating booking...');
        const bookingResult = await makeRequest('POST', '/api/bookings', {
            email: 'test@example.com',
            groundName: 'Test Cricket Ground',
            groundLocation: 'Test City',
            bookingDate: '2026-02-10',
            timeSlot: '4:00 PM - 5:00 PM',
            price: 1500
        });
        console.log('✓ Result:', bookingResult);
        console.log('');

        // Test 5: Get bookings
        console.log('📝 Test 5: Retrieving bookings...');
        const bookingsResult = await makeRequest('GET', '/api/bookings/test@example.com');
        console.log('✓ Result:', bookingsResult);
        console.log('');

        // Test 6: Get statistics
        console.log('📝 Test 6: Retrieving statistics...');
        const statsResult = await makeRequest('GET', '/api/stats');
        console.log('✓ Result:', statsResult);
        console.log('');

        // Test 7: Get all members
        console.log('📝 Test 7: Retrieving all members...');
        const membersResult = await makeRequest('GET', '/api/members');
        console.log('✓ Result:', membersResult);
        console.log('');

        console.log('✅ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Make sure the server is running: npm start');
    }
}

// Run tests
runTests();
