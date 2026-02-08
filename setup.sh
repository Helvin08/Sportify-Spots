#!/bin/bash
# Setup script for Sports Spots Membership System

echo "🚀 Sports Spots Membership System - Setup Guide"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please download and install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js is installed: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the server, run:"
echo "   npm start"
echo ""
echo "📝 For development with auto-reload, run:"
echo "   npm run dev"
echo ""
echo "🧪 To run tests, run:"
echo "   npm test"
echo ""
echo "📖 See MEMBERSHIP_README.md for complete documentation"
