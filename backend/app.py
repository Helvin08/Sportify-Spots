import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

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

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

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
                "discountPercentage": member.get('discountPercentage', 0)
            })
        return jsonify({"success": True, "isActiveMember": False})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/membership/checkout', methods=['POST'])
def checkout():
    if not supabase:
        return jsonify({"success": False, "message": "Supabase not configured"}), 500
    data = request.json
    required = ['plan', 'fullName', 'email', 'phone']
    if not all(k in data for k in required):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    email = data['email']
    renewal_date = (datetime.now() + (timedelta(days=365) if data['plan'] == 'yearly' else timedelta(days=30))).isoformat()
    try:
        existing = supabase.table("members").select("*").eq("email", email).execute()
        member_data = {
            "fullName": data['fullName'],
            "phone": data['phone'],
            "plan": data['plan'],
            "status": "active",
            "purchaseDate": datetime.now().isoformat(),
            "renewalDate": renewal_date,
            "discountPercentage": 20,
        }
        if existing.data:
            supabase.table("members").update(member_data).eq("email", email).execute()
        else:
            member_data.update({
                "email": email,
                "totalBookings": 0,
                "totalSavings": 0,
                "createdAt": datetime.now().isoformat()
            })
            supabase.table("members").insert(member_data).execute()
        return jsonify({"success": True, "message": "Membership activated successfully!", "email": email})
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
        final_price = price - discount
        booking = {
            "memberId": member['id'],
            "email": email,
            "groundName": data.get('groundName'),
            "originalPrice": price,
            "discount": discount,
            "finalPrice": final_price,
            "status": "confirmed",
            "createdAt": datetime.now().isoformat()
        }
        supabase.table("bookings").insert(booking).execute()
        new_stats = {
            "totalBookings": member.get('totalBookings', 0) + 1,
            "totalSavings": member.get('totalSavings', 0) + discount
        }
        supabase.table("members").update(new_stats).eq("email", email).execute()
        return jsonify({"success": True, "message": "Booking confirmed!", "booking": booking})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
