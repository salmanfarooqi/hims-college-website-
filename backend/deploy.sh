#!/bin/bash

echo "🚀 Deploying HIMS Backend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please login first:"
    echo "vercel login"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup admin account (optional)
read -p "Do you want to setup admin account? (y/n): " setup_admin
if [ "$setup_admin" = "y" ]; then
    echo "👤 Setting up admin account..."
    npm run setup
fi

# Seed data (optional)
read -p "Do you want to seed initial data? (y/n): " seed_data
if [ "$seed_data" = "y" ]; then
    echo "🌱 Seeding initial data..."
    npm run seed
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "📋 Next steps:"
echo "1. Update the BASE_URL in test-api.js with your Vercel URL"
echo "2. Test your API endpoints"
echo "3. Share your API URL with your frontend team" 