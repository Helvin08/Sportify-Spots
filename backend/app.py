import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
import razorpay

# Load environment variables
load_dotenv()

# Project root directory
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC_DIR = os.path.join(ROOT_DIR, 'Public')
VIEWS_DIR = os.path.join(ROOT_DIR, 'views')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Supabase Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Razorpay Configuration
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "YOUR_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "YOUR_KEY_SECRET")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
rz_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# ============ STATIC FILES SERVING ============

@app.route('/')
def serve_index():
    return send_from_directory(VIEWS_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_views(filename):
    if os.path.exists(os.path.join(VIEWS_DIR, filename)):
        return send_from_directory(VIEWS_DIR, filename)
    return send_from_directory(PUBLIC_DIR, filename)

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(PUBLIC_DIR, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(PUBLIC_DIR, 'js'), filename)

@app.route('/Image/<path:filename>')
def serve_images(filename):
    return send_from_directory(os.path.join(PUBLIC_DIR, 'Image'), filename)

# ============ AUTH ENDPOINTS ============

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    if not supabase:
        return jsonify({"success": False, "message": "Supabase not configured"}), 500
    data = request.json
    required = ['fullName', 'email', 'phone', 'password']
    if not all(k in data for k in required):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    email = data['email'].strip().lower()
    
    try:
        # Check if user already exists in members table
        existing = supabase.table("members").select("*").eq("email", email).execute()
        if existing.data:
            return jsonify({"success": False, "message": "User already exists"}), 400
        
        user_data = {
            "fullName": data['fullName'],
            "email": email,
            "phone": data['phone'],
            "password": data['password'], # In a real app, hash this!
            "status": "inactive",
            "totalBookings": 0,
            "totalSavings": 0,
            "createdAt": datetime.now().isoformat()
        }
        supabase.table("members").insert(user_data).execute()
        return jsonify({"success": True, "message": "Signup successful! Please login."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    if not supabase:
        return jsonify({"success": False, "message": "Supabase not configured"}), 500
    data = request.json
    email = data.get('email', '').strip().lower()
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"}), 400
    
    try:
        response = supabase.table("members").select("*").eq("email", email).eq("password", password).execute()
        user = response.data[0] if response.data else None
        
        if user:
            admin_list = ['admin@groundbooking.com', 'owner@groundbooking.com', 'sahayahelvin0806@gmail.com']
            return jsonify({
                "success": True,
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "fullName": user['fullName'],
                    "isAdmin": user['email'].lower() in admin_list
                }
            })
        return jsonify({"success": False, "message": "Invalid email or password"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ============ API ENDPOINTS ============

@app.route('/api/membership/verify', methods=['POST'])
def verify_membership():
    if not supabase:
        return jsonify({"success": False, "message": "Supabase not configured"}), 500
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({"success": False, "isActiveMember": False, "message": "Email required"}), 400
    try:
        response = supabase.table("members").select("*").eq("email", email).execute()
        member = response.data[0] if response.data else None
        if member and member.get('status') == 'active':
            return jsonify({
                "success": True,
                "isActiveMember": True,
                "plan": member.get('plan'),
                "discountPercentage": member.get('discountPercentage', 0),
                "hasFirstBookingOffer": member.get('hasFirstBookingOffer', False),
                "totalBookings": member.get('totalBookings', 0),
                "totalSavings": member.get('totalSavings', 0)
            })
        return jsonify({"success": True, "isActiveMember": False})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/membership/create-order', methods=['POST'])
def create_membership_order():
    data = request.json
    plan = data.get('plan', 'monthly')
    
    # Prices in INR (will convert to paise)
    prices = {
        'monthly': 499,
        'pro-plus': 999,
        'yearly': 4999 # Assuming a yearly price
    }
    
    amount = prices.get(plan, 499) * 100 # Razorpay expects amount in paise
    
    try:
        order_data = {
            'amount': amount,
            'currency': 'INR',
            'payment_capture': 1 # Auto capture
        }
        order = rz_client.order.create(data=order_data)
        return jsonify({
            "success": True, 
            "order_id": order['id'], 
            "amount": amount,
            "key_id": RAZORPAY_KEY_ID
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/membership/verify-payment', methods=['POST'])
def verify_membership_payment():
    data = request.json
    try:
        # Verify signature
        params_dict = {
            'razorpay_order_id': data.get('razorpay_order_id'),
            'razorpay_payment_id': data.get('razorpay_payment_id'),
            'razorpay_signature': data.get('razorpay_signature')
        }
        rz_client.utility.verify_payment_signature(params_dict)
        return jsonify({"success": True, "message": "Payment verified successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": "Payment verification failed"}), 400

@app.route('/api/membership/checkout', methods=['POST'])
def checkout():
    if not supabase:
        return jsonify({"success": False, "message": "Supabase not configured"}), 500
    data = request.json
    required = ['plan', 'fullName', 'email', 'phone']
    if not all(k in data for k in required):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    email = data['email']
    plan = data.get('plan', 'monthly')
    
    # Determine discount based on plan
    discount_percentage = 10
    if plan == 'pro-plus' or plan == 'yearly':
        discount_percentage = 20
        
    renewal_date = (datetime.now() + (timedelta(days=365) if plan == 'yearly' else timedelta(days=30))).isoformat()
    try:
        existing = supabase.table("members").select("*").eq("email", email).execute()
        member_data = {
            "fullName": data['fullName'],
            "phone": data['phone'],
            "plan": plan,
            "status": "active",
            "purchaseDate": datetime.now().isoformat(),
            "renewalDate": renewal_date,
            "discountPercentage": discount_percentage,
        }
        
        # Try to add special offer field, but don't fail if column doesn't exist yet
        try:
            # We add it conditionally to avoid schema errors if user hasn't added the column
            member_data["hasFirstBookingOffer"] = True if plan == 'pro-plus' else False
        except:
            pass
            
        if existing.data:
            try:
                supabase.table("members").update(member_data).eq("email", email).execute()
            except Exception as e:
                # If it fails due to the new column, try updating without it
                if "hasFirstBookingOffer" in str(e):
                    member_data.pop("hasFirstBookingOffer", None)
                    supabase.table("members").update(member_data).eq("email", email).execute()
                else:
                    raise e
        else:
            member_data.update({
                "email": email,
                "totalBookings": 0,
                "totalSavings": 0,
                "createdAt": datetime.now().isoformat()
            })
            try:
                supabase.table("members").insert(member_data).execute()
            except Exception as e:
                if "hasFirstBookingOffer" in str(e):
                    member_data.pop("hasFirstBookingOffer", None)
                    supabase.table("members").insert(member_data).execute()
                else:
                    raise e
        return jsonify({"success": True, "message": "Membership activated successfully!", "email": email})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/bookings/create-order', methods=['POST'])
def create_booking_order():
    data = request.json
    try:
        amount = int(float(data.get('amount', 0)) * 100) # Razorpay expects amount in paise
        if amount <= 0:
            return jsonify({"success": False, "message": "Invalid amount"}), 400
            
        order_data = {
            'amount': amount,
            'currency': 'INR',
            'payment_capture': 1
        }
        order = rz_client.order.create(data=order_data)
        return jsonify({
            "success": True, 
            "order_id": order['id'], 
            "amount": amount,
            "key_id": RAZORPAY_KEY_ID
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    if not supabase:
        return jsonify({"success": False, "message": "Supabase not configured"}), 500
    data = request.json
    email = data.get('email')
    try:
        res = supabase.table("members").select("*").eq("email", email).eq("status", "active").execute()
        member = res.data[0] if res.data else None
        if not member:
            return jsonify({"success": False, "message": "Member not active or not found"}), 401
        
        try:
            price = float(data.get('price', 0))
        except (ValueError, TypeError):
            price = 0.0
            
        discount = (price * member['discountPercentage']) / 100
        
        # Apply special first booking offer for Pro Plus members
        extra_offer = 0
        if member.get('hasFirstBookingOffer') and member.get('totalBookings', 0) == 0:
            extra_offer = 100 # ₹100 flat off on first booking
            discount += extra_offer
            
        final_price = max(0, price - discount)
        booking = {
            "memberId": member['id'],
            "email": email,
            "groundName": data.get('groundName'),
            "originalPrice": price,
            "discount": discount,
            "extraOffer": extra_offer,
            "finalPrice": final_price,
            "status": "confirmed",
            "createdAt": datetime.now().isoformat()
        }
        supabase.table("bookings").insert(booking).execute()
        
        # Update member stats and consume the offer if used
        new_stats = {
            "totalBookings": member.get('totalBookings', 0) + 1,
            "totalSavings": member.get('totalSavings', 0) + discount
        }
        if extra_offer > 0:
            new_stats["hasFirstBookingOffer"] = False
            
        try:
            supabase.table("members").update(new_stats).eq("email", email).execute()
        except Exception as e:
            # If update fails due to missing column, retry without it
            if "hasFirstBookingOffer" in str(e):
                new_stats.pop("hasFirstBookingOffer", None)
                supabase.table("members").update(new_stats).eq("email", email).execute()
            else:
                raise e
        return jsonify({"success": True, "message": "Booking confirmed!", "booking": booking})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/bookings/verify-payment', methods=['POST'])
def verify_booking_payment():
    data = request.json
    try:
        params_dict = {
            'razorpay_order_id': data.get('razorpay_order_id'),
            'razorpay_payment_id': data.get('razorpay_payment_id'),
            'razorpay_signature': data.get('razorpay_signature')
        }
        rz_client.utility.verify_payment_signature(params_dict)
        return jsonify({"success": True, "message": "Payment verified successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": "Payment verification failed"}), 400

@app.route('/api/membership/<email>', methods=['DELETE'])
def cancel_membership(email):
    if not supabase:
        return jsonify({"success": False, "message": "Supabase not configured"}), 500
    try:
        # Check if member exists
        response = supabase.table("members").select("*").eq("email", email).execute()
        if not response.data:
            return jsonify({"success": False, "message": "Member not found"}), 404
        
        # Update status to cancelled
        update_data = {
            "status": "cancelled",
            "cancelledAt": datetime.now().isoformat()
        }
        
        try:
            supabase.table("members").update(update_data).eq("email", email).execute()
        except Exception as e:
            # If cancelledAt column doesn't exist, try updating just the status
            if "cancelledAt" in str(e):
                update_data.pop("cancelledAt")
                supabase.table("members").update(update_data).eq("email", email).execute()
            else:
                raise e
        
        return jsonify({"success": True, "message": "Membership cancelled successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
