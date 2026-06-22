
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
1. **Node.js**: Version 18 or higher
2. **MongoDB**: Installed locally or use MongoDB Atlas
3. **Cloudinary Account**: For image storage (free tier available at https://cloudinary.com)
4. **Gmail Account**: For sending emails (with App Password)

### Gmail App Password Setup:
1. Go to your Google Account
2. Enable 2-Step Verification
3. Go to "App Passwords" (under Security)
4. Create a new app password (select "Mail" and "Other" as the app)
5. Use this password as `EMAIL_PASS` in your backend `.env` file

### Backend Setup:
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example .env file and update with your credentials:
   ```bash
   cp .env.example .env
   ```

4. Open `.env` and update the values:
   - Replace `JWT_SECRET` with a long, random string
   - Add your Cloudinary credentials
   - Add your Gmail email and App Password
   - (Optional) Update `MONGODB_URI` if using MongoDB Atlas

5. Seed the admin account:
   ```bash
   npm run seed:admin
   ```

6. Start the backend server:
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

3. Copy the example .env file:
   ```bash
   cp .env.example .env
   ```

4. (Optional) Update `.env` if your backend is running on a different port

5. Start the frontend dev server:
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
