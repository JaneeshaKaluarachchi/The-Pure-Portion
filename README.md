# PurePortion – Smart Food Management & Meal Planning System

A full-stack web application designed to help Sri Lankan households and restaurants reduce food waste through smart portion calculation, inventory tracking, recipe management, and financial management.

## 🌟 Features

### 👤 User Management
- Secure registration and login for household and restaurant users
- Role-based access control (Household, Restaurant Manager, Staff)

### 🍽️ Portion Calculator
- Smart ingredient quantity calculation based on number of people
- Dynamic meal cost estimation

### 📦 Inventory Management
- Track available ingredients and stock levels
- Expiry date monitoring with alerts
- Low-stock notifications
- Downloadable PDF inventory reports

### 🍳 Recipe Management
- AI-powered recipe suggestions from available or leftover ingredients
- Supports both household and restaurant use cases

### ♻️ Leftover & Donation Management
- Reuse or donate excess food
- NGO connections for food donations

### 💰 Financial Management
- Grocery expense tracking
- Meal cost calculation
- Restaurant staff salary management (EPF, ETF, bonuses, allowances)
- Automated PDF financial reports

### 🔔 Notifications & Alerts
- Ingredient expiry reminders
- Low stock alerts
- Donation request updates
- Financial notifications

## 🏗️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Axios
- React Router

### Backend
- Node.js
- Express.js
- REST API

### Database
- MongoDB
- Mongoose ODM

## 📋 Prerequisites
- Node.js v18+
- npm v9+
- MongoDB (Local or Atlas)

## 🚀 Getting Started

### Installation

1. Clone the repository
```bash
   git clone <repository-url>
   cd PurePortion
```

2. Install backend dependencies
```bash
   cd backend
   npm install
```

3. Install frontend dependencies
```bash
   cd frontend
   npm install
```

### Configuration

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pureportion

# JWT Secret
JWT_SECRET=your-secret-key

# Application
PORT=5000
CLIENT_URL=http://localhost:3000

### Running the Application

Start the backend:
```bash
cd backend
npm start
```

Start the frontend:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`
