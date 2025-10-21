#!/bin/bash

# RightYeh Backend Setup Script
echo "🚀 Setting up RightYeh Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

# Check if required environment variables are set
echo "🔍 Checking environment configuration..."
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm test

echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Run 'npm run dev' to start development server"
echo "3. Visit http://localhost:3000/health to verify server is running"
echo ""
echo "📚 For deployment instructions, see DEPLOYMENT.md"
