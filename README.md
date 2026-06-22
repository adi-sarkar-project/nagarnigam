
# URBANRESOLVE - Complaint Management System

A modern, full-stack complaint management system for municipal corporations, built with React, TypeScript, Node.js, Express, and MongoDB.

## Features

- 👥 **Multi-Role Authentication**:
  - Citizens can register, raise complaints, and track their status
  - Staff can manage assigned complaints and submit resolutions
  - Admins can approve users, manage complaints, and monitor the system

- 📸 **Image Upload**: Attach before and after photos to complaints
- 📧 **Email Notifications**:
  - Account approval emails
  - Complaint status updates
  - Password reset OTP emails
- 🎨 **Beautiful UI**: Modern, responsive design with saffron-white-green theme
- 📊 **Dashboard Stats**: Real-time statistics for admins

## Tech Stack

### Frontend:
- React 19 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Lucide icons

### Backend:
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Multer for file uploads
- Cloudinary for image storage
- Nodemailer for email notifications
- PDFKit for report generation

## Installation & Setup

### Prerequisites:
- Node.js (v18 or higher)
- MongoDB
- Cloudinary account
- Gmail account for email notifications

### Backend Setup:
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/urbanresolve
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development
   CLOUDINARY_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   CLOUDINARY_FOLDER=urbanresolve
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   ```

4. Seed the admin account:
   ```bash
   npm run seed:admin
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup:
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory with the following content:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the frontend dev server:
   ```bash
   npm run dev
   ```

## Usage

### Admin Login:
- Use the credentials from the admin seed script
- URL: http://localhost:5173/admin

### Citizen:
- Register an account at http://localhost:5173/register
- Wait for admin approval
- Raise complaints and track status

### Staff:
- Register an account at http://localhost:5173/staff/register
- Wait for admin approval
- Manage assigned complaints

## Scripts

### Backend:
- `npm run dev`: Start development server
- `npm start`: Start production server
- `npm run seed:admin`: Create admin account
- `npm run db:clear`: Clear all database data
- `npm run migrate:users`: Migrate legacy users
- `npm run drop:users`: Drop legacy users collection

### Frontend:
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Project Structure

```
adisarkar-urban/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/
    │   ├── pages/
    │   └── types/
    └── package.json
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Authors

- Aditya Singh
