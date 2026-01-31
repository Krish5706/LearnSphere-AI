# 📚 LearnSphere-AI - Complete Project Overview

## 🎯 Project Vision

**LearnSphere-AI** is an AI-powered learning platform that helps students efficiently study by:
- Uploading and analyzing PDF documents using AI
- Generating summaries, key points, and quizzes
- Taking notes and managing study tasks
- Tracking learning progress with analytics
- Planning study sessions with a to-do system

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                      │
├─────────────────────────────────────────────────────────────────┤
│  • User Interface (React Components)                             │
│  • State Management (useState, Context)                          │
│  • Service Layer (API Integration)                               │
│  • Authentication (JWT Token Management)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ╔════════╩═══════╗
                    │  REST API      │
                    │ (Express.js)   │
                    ╚════════╤═══════╝
                             │
┌─────────────────────────────────────────────────────────────────┐
│                  Backend (Node.js + Express)                     │
├─────────────────────────────────────────────────────────────────┤
│  • Routes & Controllers (Request Handling)                       │
│  • Middleware (Authentication, Error Handling)                   │
│  • Services (PDF Processing, AI Integration)                     │
│  • Models & Database (MongoDB)                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                    ╔════════╩═══════╗
                    │   MongoDB      │
                    │   Database     │
                    ╚════════════════╝
```

---

## 📦 Core Modules & Features

### 1. 🔐 Authentication System
**Purpose**: Secure user access and data privacy

**Components**:
- Login/Register pages
- JWT token management
- Protected routes (ProtectedRoute wrapper)
- Password reset functionality
- Session management

**Flow**:
```
User Registration
   ↓
POST /api/auth/register
   ↓
Backend: Hash password, Create user in MongoDB
   ↓
Return JWT token
   ↓
Frontend: Store token in localStorage
   ↓
Subsequent requests: Include token in Authorization header
```

**Files**:
- Frontend: `src/components/auth/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`
- Backend: `controllers/authController.js`, `routes/authRoutes.js`
- Database: `models/User.js`

---

### 2. 📄 Document Management
**Purpose**: Upload, store, and manage PDF documents

**Features**:
- Upload PDF files
- Store document metadata
- Delete documents
- View document list in library
- Track upload date and page count

**Flow**:
```
User Uploads PDF
   ↓
Frontend: FormData with file
   ↓
POST /api/documents/upload
   ↓
Backend: 
  • Receive file
  • Save to /uploads folder
  • Store metadata in MongoDB
  ↓
Return document ID
   ↓
Frontend: Add to library list
```

**Files**:
- Frontend: `src/pages/Upload.jsx`, `components/pdf/UploadPDF.jsx`
- Backend: `controllers/documentController.js`, `routes/documentRoutes.js`
- Database: `models/Document.js`
- Middleware: `middleware/uploadMiddleware.js` (file handling)

---

### 3. 🤖 AI Document Analysis
**Purpose**: Extract insights from PDFs using Gemini AI

**Features**:
- Generate summaries
- Extract key points
- Identify topics
- Create study guides

**Connected Endpoints**:
- `POST /api/documents/process` - Trigger AI processing
- Analysis stored in Document model

**AI Service**:
- `backend/services/geminiProcessor.js` - Calls Google Gemini API
- Processes PDF content through AI
- Returns structured insights

**Flow**:
```
PDF Uploaded
   ↓
Generate Summary using Gemini AI
   ↓
Extract Key Points
   ↓
Store results in MongoDB Document
   ↓
Display on Document Details page
```

**Files**:
- `backend/services/geminiProcessor.js`
- `backend/services/pdfParseService.js` (PDF parsing)
- `backend/controllers/documentController.js`

---

### 4. 📝 Notes System
**Purpose**: Create and manage study notes from documents

**Features**:
- Create notes from documents
- Edit and delete notes
- Link notes to PDFs
- Organize notes by topic

**Data Model**:
```javascript
{
  user: ObjectId (ref: User),
  document: ObjectId (ref: Document),
  title: String,
  content: String,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**API Endpoints**:
- `GET /api/notes` - Fetch user's notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

**Files**:
- Frontend: `src/components/Notes.jsx`
- Backend: `controllers/noteController.js`, `routes/noteRoutes.js`
- Database: `models/Note.js`

---

### 5. 🧠 Quiz System
**Purpose**: Generate and administer AI-powered quizzes

**Features**:
- Auto-generate quiz questions from document content
- Multiple choice questions
- Track quiz attempts and scores
- Review correct/incorrect answers
- Analytics on quiz performance

**Flow**:
```
User selects "Generate Quiz" for PDF
   ↓
POST /api/documents/:id/generate-quiz
   ↓
Backend:
  • Extract document content
  • Send to Gemini AI for question generation
  • Create quiz questions
  ↓
Frontend: Display quiz questions
   ↓
User answers and submits
   ↓
POST /api/documents/submit-quiz
   ↓
Backend: Grade answers, store results
   ↓
Display results and analysis
```

**Data Model**:
```javascript
Quiz {
  user: ObjectId,
  document: ObjectId,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    userAnswer: Number,
    explanation: String
  }],
  score: Number,
  totalQuestions: Number,
  attempt: Number,
  completedAt: Date
}
```

**Files**:
- Frontend: `src/components/quiz/QuizGenerator.jsx`, `QuizPage.jsx`, `QuizResult.jsx`
- Backend: `controllers/quizController.js`
- AI Service: `services/geminiProcessor.js`

---

### 6. ✅ Study To-Do System ⭐ NEW
**Purpose**: Plan and track learning activities

**Features**:
- Create tasks with title, description, priority, due date
- Link tasks to PDFs, Quizzes, or Notes
- Mark tasks complete
- Filter by status and priority
- View upcoming tasks on dashboard
- Track completion rate

**Data Model**:
```javascript
Todo {
  user: ObjectId (ref: User) - REQUIRED,
  title: String (max 100 chars) - REQUIRED,
  description: String (max 500 chars),
  status: 'pending' | 'completed' - default: 'pending',
  priority: 'low' | 'medium' | 'high' - default: 'medium',
  dueDate: Date - REQUIRED (cannot be in past),
  linkedEntity: {
    type: 'document' | 'quiz' | 'note',
    entityId: ObjectId,
    entityTitle: String
  },
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**API Endpoints**:
```
POST   /api/todos              → Create task
GET    /api/todos              → Fetch tasks (with filters)
GET    /api/todos/stats        → Dashboard statistics
PUT    /api/todos/:id          → Update task
PATCH  /api/todos/:id/done     → Mark completed
DELETE /api/todos/:id          → Delete task
```

**Frontend Components**:
- `src/pages/Todo.jsx` - Main page
- `src/components/todo/TodoList.jsx` - Task list with stats
- `src/components/todo/TodoItem.jsx` - Individual task
- `src/components/todo/TodoFilters.jsx` - Filter controls
- `src/components/todo/AddEditTodoModal.jsx` - Create/edit form

**Files**:
- Frontend Service: `src/services/todoService.js`
- Backend: `controllers/todoController.js`, `routes/todoRoutes.js`, `models/Todo.js`

---

### 7. 📊 Dashboard & Analytics
**Purpose**: Centralized view of student progress

**Dashboard Features**:
- Study progress metrics (4 cards):
  - Tasks due today
  - Pending tasks
  - Completed tasks
  - Completion rate %
- Document library preview
- Upcoming tasks widget
- Quick navigation to all features
- Document search

**Connected to**:
- Todo stats API (getTodoStats)
- Documents API (getUserDocuments)
- Todo list API (getTodos)

**Files**:
- Frontend: `src/pages/Dashboard.jsx`

---

### 8. 👤 User Profile & Settings
**Purpose**: User account management

**Features**:
- View profile information
- Update user details
- Change password
- Manage preferences
- Account settings

**Files**:
- Frontend: `src/pages/Profile.jsx`, `src/pages/Settings.jsx`
- Backend: `controllers/userController.js`, `routes/userRoutes.js`

---

## 🌐 Complete Route Map

### Frontend Routes (React Router)

```
PUBLIC ROUTES
├── /                    → Home page
├── /login               → User login
├── /register            → User registration
└── /forgot-password     → Password recovery

PROTECTED ROUTES (Require JWT)
├── /upload              → PDF upload page
├── /dashboard           → Dashboard with todo widget
├── /todos               → Study tasks management ⭐ NEW
├── /document/:id        → Document details & analysis
├── /quiz/:documentId    → Quiz interface
├── /settings            → User settings
└── /profile             → User profile
```

### Backend API Routes

```
AUTHENTICATION
POST   /api/auth/register           → Register user
POST   /api/auth/login              → Login user
POST   /api/auth/forgot-password    → Request password reset
POST   /api/auth/reset-password     → Reset password

DOCUMENTS
GET    /api/documents               → Get user's documents
POST   /api/documents               → Upload new document
GET    /api/documents/:id           → Get document details
DELETE /api/documents/:id           → Delete document
POST   /api/documents/process       → Process with AI
POST   /api/documents/submit-quiz   → Submit quiz answers

NOTES
GET    /api/notes                   → Get all notes
POST   /api/notes                   → Create note
PUT    /api/notes/:id               → Update note
DELETE /api/notes/:id               → Delete note

TODOS ⭐ NEW
POST   /api/todos                   → Create task
GET    /api/todos                   → Get tasks (filtered)
GET    /api/todos/stats             → Get statistics
PUT    /api/todos/:id               → Update task
PATCH  /api/todos/:id/done          → Mark completed
DELETE /api/todos/:id               → Delete task

USERS
GET    /api/users/me                → Get profile
PUT    /api/users/me                → Update profile
```

---

## 🔄 Data Flow Diagrams

### Complete User Journey

```
1. SIGNUP/LOGIN
   User fills form → POST /api/auth/register/login
   → Backend creates user/validates credentials
   → JWT token returned → Stored in localStorage
   → Redirect to dashboard

2. UPLOAD PDF
   User selects PDF → POST /api/documents/upload
   → Backend processes file → Stores in /uploads
   → Metadata saved to MongoDB
   → Redirect to document details

3. ANALYZE DOCUMENT
   Click "Generate Summary" → Gemini AI processes content
   → AI generates summary/key points
   → Results displayed on page
   → Stored in MongoDB

4. CREATE QUIZ
   Click "Generate Quiz" → Backend calls Gemini AI
   → AI creates questions based on document
   → Quiz displayed to user
   → User submits answers

5. SUBMIT QUIZ
   Submit answers → POST /api/documents/submit-quiz
   → Backend grades quiz
   → Results displayed
   → Score stored in MongoDB

6. CREATE TODO
   Click "+ Add Task" → Fill form → Submit
   → POST /api/todos with task data
   → Backend validates → Stores in MongoDB
   → Task appears in list

7. MANAGE TODOS
   User can:
   • Mark complete (PATCH /api/todos/:id/done)
   • Edit task (PUT /api/todos/:id)
   • Delete task (DELETE /api/todos/:id)
   • View on Dashboard widget
```

### Document Analysis Flow

```
PDF Upload
    ↓
┌───────────────────────┐
│ Extract PDF Content   │ ← pdfParseService.js
├───────────────────────┤
│ Send to Gemini AI     │ ← geminiProcessor.js
├───────────────────────┤
│ Generate:             │
│ • Summary             │
│ • Key Points          │
│ • Topics              │
│ • Quiz Questions      │
├───────────────────────┤
│ Store Results         │ ← MongoDB Document
├───────────────────────┤
│ Display to User       │ ← Frontend components
└───────────────────────┘
```

---

## 🗄️ Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  credits: Number,
  preferences: {},
  createdAt: Date,
  updatedAt: Date
}
```

### Document Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  fileName: String,
  fileUrl: String,
  pageCount: Number,
  summary: String,
  keyPoints: [String],
  topics: [String],
  uploadedAt: Date,
  size: Number,
  quizCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Todo Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  title: String,
  description: String,
  status: String (pending/completed),
  priority: String (low/medium/high),
  dueDate: Date,
  linkedEntity: {
    type: String (document/quiz/note),
    entityId: ObjectId,
    entityTitle: String
  },
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Note Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  document: ObjectId (ref: Document),
  title: String,
  content: String,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Quiz Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  document: ObjectId (ref: Document),
  questions: [
    {
      question: String,
      options: [String],
      correctAnswer: Number,
      userAnswer: Number,
      explanation: String
    }
  ],
  score: Number,
  totalQuestions: Number,
  attempt: Number,
  completedAt: Date
}
```

---

## 🔐 Security Implementation

### Authentication
```
JWT Token System
├── User logs in
├── Backend creates JWT token
├── Frontend stores in localStorage
├── All API requests include token in Authorization header
├── Backend verifies token with authMiddleware
└── Token expires after set time
```

### Authorization
```
Protected Routes
├── ProtectedRoute wrapper checks for valid JWT
├── If no token → Redirect to /login
├── If token invalid → Redirect to /login
├── If token valid → Allow access to route
```

### Data Privacy
```
Per-User Data Access
├── All queries filtered by req.user._id
├── Users can only access their own:
│   ├── Documents
│   ├── Notes
│   ├── Quizzes
│   ├── Tasks (Todos)
│   └── Profile
├── Ownership verification on update/delete
└── 403 error if unauthorized access attempted
```

### Input Validation
```
Server-Side Validation
├── Required fields checked
├── Type validation
├── Length limits (titles, descriptions)
├── Email format validation
├── Date validation (no past dates for todos)
├── SQL/NoSQL injection prevention
└── XSS protection via sanitization
```

---

## 🏃 Component Connection Flow

### Navigation Flow
```
Navbar (Persistent)
├── Logo → /
├── Upload → /upload
├── Library → /dashboard
├── Tasks → /todos ⭐
└── Profile Dropdown
    ├── Settings → /settings
    ├── Profile → /profile
    └── Logout → /login
```

### Service Layer Architecture
```
Frontend Components
        ↓
Service Layer (API calls)
├── authService.js
├── todoService.js ⭐
├── api.js (base axios config)
├── pdfService.js
├── quizService.js
├── noteService.js
└── documentService.js
        ↓
Backend API (/api/*)
        ↓
Controllers (business logic)
        ↓
MongoDB (data persistence)
```

### State Management
```
Context API
├── AuthContext.jsx
│   ├── User state
│   ├── Login/Logout functions
│   └── Token management
│
└── ThemeContext.jsx
    ├── Dark/Light mode
    └── Theme preferences
```

---

## 📁 Project File Structure

```
LearnSphere-AI/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js
│   │   ├── Note.js
│   │   ├── Quiz.js
│   │   └── Todo.js ⭐
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── documentController.js
│   │   ├── noteController.js
│   │   ├── quizController.js
│   │   ├── todoController.js ⭐
│   │   └── userController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── noteRoutes.js
│   │   ├── quizRoutes.js
│   │   ├── todoRoutes.js ⭐
│   │   └── userRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js (JWT verification)
│   │   ├── errorMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── services/
│   │   ├── geminiProcessor.js (AI processing)
│   │   ├── pdfParseService.js (PDF parsing)
│   │   ├── pdfExporter.js
│   │   └── mindMapService.js
│   │
│   ├── server.js (main entry point)
│   ├── package.json
│   └── config/ (environment variables)
│
└── frontend/ (forntend/)
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Upload.jsx
    │   │   ├── Dashboard.jsx ⭐ Enhanced
    │   │   ├── Document.jsx
    │   │   ├── Quiz.jsx
    │   │   ├── Todo.jsx ⭐ NEW
    │   │   ├── Settings.jsx
    │   │   └── Profile.jsx
    │   │
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Navbar.jsx ⭐ Enhanced
    │   │   │   ├── Footer.jsx
    │   │   │   ├── Loader.jsx
    │   │   │   ├── Dropdown.jsx
    │   │   │   └── ProtectedRoute.jsx
    │   │   │
    │   │   ├── auth/
    │   │   │   ├── Login.jsx
    │   │   │   ├── Register.jsx
    │   │   │   └── ForgotPassword.jsx
    │   │   │
    │   │   ├── todo/ ⭐ NEW
    │   │   │   ├── TodoList.jsx
    │   │   │   ├── TodoItem.jsx ⭐
    │   │   │   ├── TodoFilters.jsx
    │   │   │   └── AddEditTodoModal.jsx ⭐
    │   │   │
    │   │   ├── pdf/
    │   │   ├── quiz/
    │   │   ├── notes/
    │   │   ├── dashboard/
    │   │   └── mindmap/
    │   │
    │   ├── services/ ⭐ NEW/Enhanced
    │   │   ├── api.js (base axios)
    │   │   ├── authService.js
    │   │   ├── todoService.js ⭐ NEW
    │   │   ├── documentService.js
    │   │   ├── quizService.js
    │   │   ├── noteService.js
    │   │   └── pdfService.js
    │   │
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   │
    │   ├── App.jsx ⭐ Enhanced
    │   ├── main.jsx
    │   └── index.css
    │
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🚀 How Everything Connects

### Example: Complete User Workflow

```
1. USER SIGNUP
   ↓
   User fills registration form
   ↓
   Frontend: POST /api/auth/register
   ↓
   Backend: authController.register()
   ↓
   Create user in MongoDB
   ↓
   Return JWT token
   ↓
   Frontend: Store token in localStorage, Redirect to /dashboard

2. UPLOAD & ANALYZE PDF
   ↓
   User navigates to /upload
   ↓
   Upload component shows file input
   ↓
   User selects PDF → Submit
   ↓
   Frontend: POST /api/documents/upload (multipart/form-data)
   ↓
   Backend: uploadMiddleware saves file to /uploads
   ↓
   documentController.uploadDocument() stores metadata in MongoDB
   ↓
   Return document ID
   ↓
   Frontend: Redirect to /document/:id
   ↓
   Display document details with "Generate Summary" button

3. USER CLICKS "GENERATE SUMMARY"
   ↓
   Frontend: GET /api/documents/:id/summary
   ↓
   Backend: Fetch document from MongoDB
   ↓
   documentController calls geminiProcessor.processPDF()
   ↓
   AI analyzes PDF content
   ↓
   Returns summary, key points, topics
   ↓
   Results stored in MongoDB Document
   ↓
   Frontend: Display results on page

4. USER CREATES QUIZ
   ↓
   Frontend: POST /api/documents/:id/generate-quiz
   ↓
   Backend: Extract document content
   ↓
   Call Gemini AI to generate questions
   ↓
   Create Quiz document in MongoDB
   ↓
   Frontend: Redirect to /quiz/:documentId
   ↓
   Display quiz questions

5. USER CREATES TODO TASK
   ↓
   User clicks "Tasks" in navbar → /todos
   ↓
   Click "+ Add Task"
   ↓
   AddEditTodoModal opens
   ↓
   Fill form: Title, Description, Priority, Due Date
   ↓
   Optional: Link to PDF
   ↓
   Click "Create Task"
   ↓
   Frontend: POST /api/todos
   ↓
   Backend: todoController.createTodo()
   ↓
   Validate input, check due date
   ↓
   Create Todo document in MongoDB
   ↓
   Return created todo
   ↓
   Frontend: Add to list, update UI

6. DASHBOARD DISPLAYS EVERYTHING
   ↓
   User goes to /dashboard
   ↓
   Dashboard loads data:
   │
   ├─ getTodoStats() → GET /api/todos/stats
   │  ↓
   │  Backend counts: total, completed, pending, dueToday
   │  ↓
   │  Display in 4 cards
   │
   ├─ getTodos({ status: 'pending' }) → GET /api/todos
   │  ↓
   │  Backend returns 5 most recent pending tasks
   │  ↓
   │  Display in upcoming tasks widget
   │
   └─ getUserDocuments() → GET /api/documents
      ↓
      Backend returns user's documents
      ↓
      Display in library section
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite (fast build tool)
- **Styling**: Tailwind CSS (utility-first CSS)
- **Routing**: React Router v6
- **State Management**: React Context API, useState hooks
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **UI Components**: Custom built + Tailwind

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken)
- **AI Integration**: Google Gemini API
- **File Upload**: Multer middleware
- **Environment**: dotenv for configuration

### Database
- **Type**: NoSQL (MongoDB)
- **Schema**: Mongoose (ODM)
- **Indexing**: Optimized queries for performance

### Deployment Ready
- Frontend can be deployed to: Vercel, Netlify, GitHub Pages
- Backend can be deployed to: Heroku, Railway, AWS EC2
- Database: MongoDB Atlas (cloud)

---

## 📊 Key Metrics Tracked

### Study Progress
- Total tasks created
- Completed tasks
- Pending tasks
- Completion rate percentage
- Tasks due today

### Document Analytics
- Total documents uploaded
- Documents analyzed
- Total quizzes taken
- Average quiz scores
- Study time per document

### User Engagement
- Login frequency
- PDF uploads per month
- Quiz attempts
- Task completion rate
- Notes created

---

## 🔄 Integration Points

### Frontend ↔ Backend
```
Frontend Service Layer
   ↓ (API calls via axios)
Backend Express Routes
   ↓ (JWT verified)
Controllers (Business Logic)
   ↓ (Mongoose queries)
MongoDB Collections
   ↓ (Data persistence)
```

### External Integrations
```
Google Gemini API
   ↓
geminiProcessor.js
   ↓
Called by: documentController, quizController
   ↓
Returns: Summaries, Key points, Quiz questions
```

---

## ✨ Latest Enhancements

### Todo System Integration ⭐
1. **New Database Model**: Todo collection in MongoDB
2. **New API Endpoints**: 6 endpoints for CRUD operations
3. **New Frontend Pages**: /todos route with full management UI
4. **Dashboard Enhancement**: 4 stat cards + upcoming tasks widget
5. **Navigation Update**: "Tasks" link in navbar
6. **Service Layer**: Complete todoService.js for API integration

### Files Added/Modified
```
ADDED:
- backend/models/Todo.js
- backend/controllers/todoController.js
- backend/routes/todoRoutes.js
- frontend/src/services/todoService.js
- frontend/src/pages/Todo.jsx
- frontend/src/components/todo/TodoItem.jsx ⭐
- frontend/src/components/todo/AddEditTodoModal.jsx ⭐

MODIFIED:
- frontend/src/App.jsx (added /todos route)
- frontend/src/components/common/Navbar.jsx (added Tasks link)
- frontend/src/pages/Dashboard.jsx (added todo widget)
- backend/server.js (mounted todoRoutes)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or MongoDB Atlas)
- Git

### Setup Backend
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3000
```

### Setup Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Environment Variables Needed
**Backend (.env)**:
```
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

**Frontend (.env)**:
```
VITE_API_URL=http://localhost:3000
```

---

## 📈 Future Roadmap

### Phase 2
- AI-suggested tasks from quiz results
- Study streaks tracking
- Smart reminders
- Time tracking per subject
- Progress visualizations

### Phase 3
- Collaborative study groups
- Peer notes sharing
- Study recommendations based on performance
- Mobile app (React Native)

### Phase 4
- Advanced analytics dashboard
- Learning path recommendations
- Integration with external APIs
- Gamification (badges, leaderboards)

---

## ✅ Feature Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Complete | JWT-based |
| PDF Upload | ✅ Complete | Multipart upload |
| AI Summaries | ✅ Complete | Gemini integration |
| Quiz Generation | ✅ Complete | AI-powered |
| Notes Taking | ✅ Complete | CRUD operations |
| Study Dashboard | ✅ Complete | Analytics widgets |
| Todo Management | ✅ Complete | Priority & due dates |
| User Profile | ✅ Complete | Edit settings |
| Responsive Design | ✅ Complete | Mobile-friendly |
| Error Handling | ✅ Complete | Global error handler |
| Input Validation | ✅ Complete | Server & client |
| Security | ✅ Complete | JWT, ownership checks |

---

## 🎓 Learning Resources

For developers working on this project:

1. **React Concepts**: Hooks, Context API, React Router
2. **Node.js/Express**: Middleware, Controllers, RESTful APIs
3. **MongoDB/Mongoose**: Schema design, Indexing, Queries
4. **JWT**: Token generation, verification, expiration
5. **Tailwind CSS**: Utility classes, Responsive design
6. **Axios**: HTTP requests, Interceptors

---

## 📝 Notes

- All API endpoints require JWT authentication (except auth routes)
- All timestamps are stored in UTC
- Passwords are hashed using bcrypt
- File uploads are validated on backend
- Frontend validates input before sending to backend
- Each user can only access their own data
- PDF files are stored in /uploads directory

---

## 🎉 Summary

**LearnSphere-AI** is a comprehensive AI-powered learning platform with:

✅ **Complete Authentication System** - JWT-based security
✅ **Document Management** - Upload and store PDFs
✅ **AI Integration** - Gemini API for content analysis
✅ **Smart Quizzes** - Auto-generated from documents
✅ **Note Taking** - Organize study materials
✅ **Study Planner** - Todo system for learning tasks
✅ **Analytics Dashboard** - Progress tracking
✅ **Responsive UI** - Mobile-friendly design
✅ **Secure Backend** - Ownership verification, input validation
✅ **Scalable Architecture** - Ready for growth

All features are **fully integrated, tested, and production-ready**! 🚀

---

**Project Version**: 1.0.0  
**Last Updated**: January 31, 2026  
**Status**: ✅ Production Ready
