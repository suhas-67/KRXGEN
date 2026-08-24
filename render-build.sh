#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "📦 Building React frontend..."
npm install
npm run build

echo "🐍 Installing Python backend dependencies..."
cd backend
pip install -r requirements.txt

echo "✅ Build complete!"
