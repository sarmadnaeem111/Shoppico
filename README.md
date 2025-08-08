# E-Commerce Application

A modern e-commerce platform built with React, Firebase, and Bootstrap, featuring user authentication, product management, shopping cart functionality, and more.

## Features

- **User Authentication**: Sign up, login, and user role management (Admin/Customer)
- **Product Management**: Add, edit, delete, and view products with image uploads via Cloudinary
- **Category Management**: Organize products by categories
- **Shopping Cart**: Add products to cart, update quantities, and checkout
- **User Profiles**: View and update user information
- **Admin Dashboard**: Overview of users, products, and categories
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- **Frontend**: React, React Router, Bootstrap, React-Bootstrap, Framer Motion
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Image Handling**: Cloudinary
- **State Management**: React Context API

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Cloudinary account

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd myapp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory with the following variables:

```
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_CLOUDINARY_API_KEY=your_cloudinary_api_key
REACT_APP_CLOUDINARY_API_SECRET=your_cloudinary_api_secret
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset

# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
```

## Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication:
   - Email/Password authentication
   - Google authentication (Go to Authentication > Sign-in method > Google > Enable)
3. Create a Firestore database
4. Set up Storage
5. Get your Firebase configuration from Project Settings > General > Your Apps > Firebase SDK snippet > Config

## Cloudinary Setup

1. Create a Cloudinary account at [https://cloudinary.com/](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from the Dashboard

## Project Structure

```
src/
├── assets/
│   └── images/
├── components/
│   ├── admin/
│   │   ├── CategoryManagement.js
│   │   ├── Dashboard.js
│   │   ├── ProductForm.js
│   │   ├── ProductManagement.js
│   │   └── UserManagement.js
│   ├── auth/
│   │   ├── Login.js
│   │   ├── ProtectedRoutes.js
│   │   └── Signup.js
│   ├── common/
│   │   ├── ErrorAlert.js
│   │   ├── Footer.js
│   │   ├── LoadingSpinner.js
│   │   ├── Navbar.js
│   │   ├── ProductCard.js
│   │   └── ProductFilter.js
│   └── customer/
│       ├── Cart.js
│       ├── Home.js
│       ├── ProductDetails.js
│       ├── Products.js
│       └── Profile.js
├── contexts/
│   ├── AuthContext.js
│   └── CartContext.js
├── pages/
│   ├── admin/
│   │   ├── CategoryManagementPage.js
│   │   ├── DashboardPage.js
│   │   ├── ProductFormPage.js
│   │   ├── ProductManagementPage.js
│   │   └── UserManagementPage.js
│   ├── auth/
│   │   ├── LoginPage.js
│   │   └── SignupPage.js
│   ├── customer/
│   │   ├── CartPage.js
│   │   ├── HomePage.js
│   │   ├── ProductDetailsPage.js
│   │   ├── ProductsPage.js
│   │   └── ProfilePage.js
│   └── NotFoundPage.js
├── services/
│   ├── cloudinary.js
│   ├── cloudinaryService.js
│   ├── firebase.js
│   └── firestore.js
├── utils/
│   └── helpers.js
├── App.css
├── App.js
├── index.css
└── index.js
```

## Deployment

To build the application for production:

```bash
npm run build
```

You can then deploy the contents of the `build` directory to any static hosting service like Firebase Hosting, Netlify, or Vercel.

## License

This project is licensed under the MIT License.
