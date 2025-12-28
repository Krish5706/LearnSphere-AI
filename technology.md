# Technology Stack

This document outlines all the technologies, frameworks, libraries, and tools used in the LearnSphere AI project.

## 1. Frontend Technology

### Core Framework & Runtime
- **React** (v18.3.1) - JavaScript library for building user interfaces
- **React DOM** (v18.3.1) - React renderer for web applications
- **JavaScript (ES6+)** - Modern JavaScript with ES6+ features

### Build Tools & Development
- **Vite** (v6.0.1) - Next-generation frontend build tool and dev server
  - Fast HMR (Hot Module Replacement)
  - Optimized production builds
  - Proxy configuration for API requests
- **ESLint** (v9.15.0) - Code linting and quality assurance
  - ESLint React Plugin
  - ESLint React Hooks Plugin
  - ESLint React Refresh Plugin
- **PostCSS** (v8.4.49) - CSS post-processor
- **Autoprefixer** (v10.4.20) - Automatic vendor prefixing for CSS

### Routing & Navigation
- **React Router DOM** (v7.11.0) - Declarative routing for React applications
  - BrowserRouter for client-side routing
  - Protected routes implementation
  - Dynamic route parameters

### Styling & UI
- **Tailwind CSS** (v3.4.16) - Utility-first CSS framework
  - Custom color palette (primary colors)
  - Responsive design utilities
  - Custom theme configuration
- **CSS3** - Custom global styles and theme management
  - Global CSS for base styles
  - Theme CSS for dark/light mode support

### UI Components & Icons
- **Lucide React** (v0.468.0) - Modern icon library
  - Comprehensive icon set for UI elements
  - Lightweight and tree-shakeable

### Data Visualization & Interactive Components
- **React Flow (@xyflow/react)** (v12.10.0) - Interactive node-based graphs and diagrams
  - Mind map visualization
  - Custom node and edge rendering
  - MiniMap and Controls components
  - Background patterns

### HTTP Client & API Communication
- **Axios** (v1.13.2) - Promise-based HTTP client
  - RESTful API communication
  - Request/response interceptors
  - Error handling

### Content Rendering
- **React Markdown** (v9.1.0) - Markdown renderer for React
  - Renders markdown content in components
  - Supports custom components

### AI Integration (Frontend)
- **@google/generative-ai** (v0.21.0) - Google Gemini AI SDK
  - Client-side AI interactions (if needed)
  - AI service integration

### State Management & Context
- **React Context API** - Built-in React state management
  - AuthContext for authentication state
  - ThemeContext for theme management
  - Global state without external libraries

### Type Definitions (Development)
- **@types/react** (v18.3.12) - TypeScript definitions for React
- **@types/react-dom** (v18.3.1) - TypeScript definitions for React DOM

### Development Environment
- **Node.js** - JavaScript runtime
- **npm/yarn** - Package managers

---

## 2. Backend Technology

### Runtime & Framework
- **Node.js** - JavaScript runtime environment
- **Express.js** (v5.2.1) - Fast, unopinionated web framework
  - RESTful API architecture
  - Middleware support
  - Route handling

### Database & ODM
- **MongoDB** - NoSQL document database
  - Document-based storage
  - Flexible schema design
  - Cloud (Atlas) or local deployment support
- **Mongoose** (v9.0.2) - MongoDB object modeling tool
  - Schema definition
  - Data validation
  - Middleware hooks (pre/post save)
  - Query building

### Authentication & Security
- **JSON Web Token (JWT)** (v9.0.3) - Token-based authentication
  - Secure user authentication
  - Session management
  - Token expiration handling
- **bcryptjs** (v3.0.3) - Password hashing library
  - Secure password encryption
  - Salt rounds configuration
- **Helmet** (v8.1.0) - Security middleware
  - HTTP header security
  - XSS protection
  - Content Security Policy

### File Upload & Processing
- **Multer** (v2.0.2) - Multipart/form-data handling
  - File upload middleware
  - PDF file handling
  - Storage configuration

### PDF Processing
- **pdf-parse** (v1.1.1) - PDF text extraction library
  - Extract text from PDF files
  - PDF metadata extraction
- **PDFKit** (v0.17.2) - PDF generation library
  - Generate PDF reports
  - Create downloadable documents
  - Custom PDF formatting

### AI Integration
- **@google/generative-ai** (v0.24.1) - Google Gemini AI SDK
  - Document analysis and summarization
  - Quiz generation
  - Mind map creation
  - Key points extraction
  - Supported models:
    - gemini-1.5-pro (default, free tier)
    - gemini-1.5-flash (free tier)
    - gemini-2.5-flash (may have quota limits)
    - gemini-3-pro-preview (paid tier)
    - gemini-3-flash-preview (paid tier)

### Middleware & Utilities
- **CORS** (v2.8.5) - Cross-Origin Resource Sharing
  - Enable cross-origin requests
  - Frontend-backend communication
- **Morgan** (v1.10.1) - HTTP request logger
  - Development logging
  - Request/response logging
- **dotenv** (v17.2.3) - Environment variable management
  - Configuration management
  - Secure credential storage

### File System & Path
- **fs** (Node.js built-in) - File system operations
  - File reading/writing
  - Directory management
- **path** (Node.js built-in) - Path utilities
  - File path resolution
  - Cross-platform path handling

### API Architecture
- **RESTful API** - Representational State Transfer
  - Standard HTTP methods (GET, POST, PUT, DELETE)
  - Resource-based URLs
  - JSON request/response format

### Error Handling
- **Custom Error Middleware** - Centralized error handling
  - Global error handler
  - Structured error responses
  - Error logging

### Development Tools
- **nodemon** (optional) - Development server auto-restart
- **Postman/Insomnia** (optional) - API testing tools

---

## Architecture Overview

### Frontend Architecture
- **Component-Based Architecture** - Modular React components
- **Context API** - Global state management
- **Service Layer** - API communication abstraction
- **Protected Routes** - Authentication-based routing
- **Responsive Design** - Mobile-first approach with Tailwind CSS

### Backend Architecture
- **MVC Pattern** - Model-View-Controller separation
  - Models: Mongoose schemas (User, Document)
  - Controllers: Business logic (authController, documentController, userController)
  - Routes: API endpoint definitions
- **Middleware Chain** - Request processing pipeline
- **Service Layer** - Business logic abstraction
- **Error Handling** - Centralized error management

### Data Flow
1. **Frontend** → Axios → **Backend API** → Express Middleware
2. **Express** → Controllers → **Services** → **Database (MongoDB)**
3. **AI Processing** → Google Gemini API → **Response Processing** → **Database Storage**
4. **Response** → JSON → **Frontend** → React Components → **UI Rendering**

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Helmet security headers
- Environment variable protection
- Protected API routes

### Deployment Considerations
- **Frontend**: Static build (Vite) → Can be deployed to Vercel, Netlify, or any static hosting
- **Backend**: Node.js server → Can be deployed to Heroku, Railway, AWS, or DigitalOcean
- **Database**: MongoDB Atlas (cloud) or self-hosted MongoDB
- **File Storage**: Local filesystem (can be migrated to cloud storage like AWS S3, Cloudinary)

---

## Development Workflow

### Frontend Development
```bash
cd forntend
npm install
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend Development
```bash
cd backend
npm install
npm start        # Start Express server (port 3000)
```

### Environment Setup
- Frontend: No environment variables required (uses proxy)
- Backend: Requires `.env` file with:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `GEMINI_API_KEY`
  - `PORT` (optional, defaults to 3000)

---

## Version Information

- **Node.js**: v18+ recommended
- **npm**: Latest stable version
- **React**: 18.3.1
- **Express**: 5.2.1
- **Mongoose**: 9.0.2
- **MongoDB**: Latest (Atlas or local)

---

## Additional Notes

- The project uses **CommonJS** (require/module.exports) in the backend
- The frontend uses **ES Modules** (import/export)
- **Vite** provides fast development experience with HMR
- **Tailwind CSS** enables rapid UI development
- **React Flow** provides interactive mind map visualization
- **Google Gemini AI** powers all AI features (summarization, quiz generation, mind maps)
- The architecture supports horizontal scaling and cloud deployment

