#!/bin/bash

# Primefolio Setup Script
# Run this to get your portfolio ready

echo "🚀 Primefolio Setup"
echo "=================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo "✓ Node.js $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Success message
echo ""
echo "✅ Setup complete!"
echo ""
echo "🎬 Next steps:"
echo "1. Edit content in src/data/"
echo "2. Add images to public/images/"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:5173"
echo ""
echo "📚 Guides:"
echo "- QUICK_REFERENCE.md - Quick setup guide"
echo "- GETTING_STARTED.md - Detailed setup"
echo "- DEPLOYMENT.md - How to deploy"
echo "- README.md - Full documentation"
