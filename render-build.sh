#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "📦 Installing Node.js inside Python environment..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

echo "📦 Building React frontend..."
npm install
npm run build

echo "🐍 Installing Python backend dependencies..."
cd backend
pip install -r requirements.txt

echo "✅ Build complete!"
