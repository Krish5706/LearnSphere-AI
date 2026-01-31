# LearnSphere AI - System Architecture

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Data Architecture](#data-architecture)
6. [AI Integration Architecture](#ai-integration-architecture)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [Component Interaction Diagrams](#component-interaction-diagrams)

## Overview

LearnSphere AI is a full-stack web application that leverages Google Gemini AI to transform document-based learning. The platform enables users to upload PDF documents and receive AI-powered analysis including summarization, quiz generation, mind map creation, and interactive Q&A.

### Key Features
- **Document Upload & Processing**: PDF upload with text extraction
- **AI-Powered Analysis**: Google Gemini integration for content analysis
- **Multiple Learning Modalities**: Summaries, quizzes, mind maps, Q&A
- **User Management**: Authentication, profiles, credit system
- **Responsive UI**: Modern React-based interface

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LearnSphere AI Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Frontend      │    │   Backend API   │    │  External   │  │
│  │   (React)       │◄──►│   (Node.js)     │◄──►│  Services   │  │
│  │                 │    │                 │    │             │  │
│  │  • Components   │    │  • Controllers  │    │ • Gemini AI │  │
│  │  • Pages        │    │  • Services     │    │ • MongoDB   │  │
│  │  • Services     │    │  • Models       │    │ • File      │  │
│  │  • Context      │    │  • Middleware   │    │   Storage   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Web       │  │   Database  │  │   File      │  │   AI    │ │
│  │   Server    │  │   (MongoDB) │  │   Storage   │  │   API   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Principles
- **Separation of Concerns**: Clear separation between frontend, backend, and data layers
- **Modular Design**: Component-based architecture for maintainability
- **Scalability**: Horizontal scaling support through stateless backend
- **Security**: JWT-based authentication with secure API endpoints
- **Performance**: Optimized AI processing with caching and efficient data handling

## Frontend Architecture

```
Frontend Architecture (React + Vite)
├── Public Assets
│   ├── index.html
│   ├── logo.png
│   └── favicon
├── Source Code (src/)
│   ├── main.jsx (Entry Point)
│   ├── App.jsx (Main Component & Routing)
│   ├── components/
│   │   ├── common/ (Shared Components)
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Dropdown.jsx
│   │   ├── auth/ (Authentication)
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── dashboard/ (Dashboard Features)
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── DocumentStats.jsx
│   │   │   └── ...
│   │   ├── pdf/ (PDF Processing)
│   │   │   ├── UploadPDF.jsx
│   │   │   ├── PDFViewer.jsx
│   │   │   ├── ProcessingOptions.jsx
│   │   │   └── PDFList.jsx
│   │   ├── mindmap/ (Mind Map Visualization)
│   │   │   ├── MindMap.jsx
│   │   │   ├── MindMapStudio.jsx
│   │   │   └── NodeTools.jsx
│   │   ├── quiz/ (Quiz System)
│   │   │   ├── QuizContainer.jsx
│   │   │   ├── QuizGenerator.jsx
│   │   │   ├── QuizList.jsx
│   │   │   └── QuizResult.jsx
│   │   ├── summary/ (Document Summaries)
│   │   │   ├── ShortSummary.jsx
│   │   │   ├── MediumSummary.jsx
│   │   │   └── DetailedSummary.jsx
│   │   ├── qa/ (Q&A Interface)
│   │   │   ├── ChatBox.jsx
│   │   │   └── QuestionInput.jsx
│   │   └── Editor.jsx (Rich Text Editor)
│   ├── pages/ (Route Components)
│   │   ├── Home.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Upload.jsx
│   │   ├── Document.jsx
│   │   ├── Quiz.jsx
│   │   ├── Settings.jsx
│   │   └── Profile.jsx
│   ├── context/ (Global State)
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── services/ (API & External Services)
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── aiService.js
│   │   ├── pdfService.js
│   │   ├── quizService.js
│   │   └── noteService.js
│   ├── utils/ (Utilities & Helpers)
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── ...
│   ├── styles/ (Global Styles)
│   │   ├── global.css
│   │   ├── theme.css
│   │   └── ...
│   ├── extensions/ (Editor Extensions)
│   │   ├── font-size.js
│   │   ├── FontSize.js
│   │   └── LineHeight.js
│   └── assets/ (Static Assets)
├── Configuration Files
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── eslint.config.js
└── Build Output (dist/)

### Frontend Technologies
- **React 18**: Component-based UI framework
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Context API**: Global state management
- **Axios**: HTTP client for API calls

### Frontend Key Components
- **Authentication Flow**: Login/Register with JWT token management
- **Dashboard**: User analytics and document overview
- **PDF Processing**: Upload, view, and process PDF documents
- **AI Features**: Summarization, quiz generation, mind maps, Q&A
- **Rich Text Editor**: Custom editor with formatting tools
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Backend Architecture

```
Backend Architecture (Node.js + Express)
├── Server Entry Point
│   └── server.js (Express App Setup & Database Connection)
├── Routes (API Endpoints)
│   ├── authRoutes.js (Authentication: Login/Register)
│   ├── documentRoutes.js (Document Processing & Management)
│   ├── userRoutes.js (User Profile & Credits)
│   └── noteRoutes.js (Note Management)
├── Controllers (Business Logic)
│   ├── authController.js (Authentication Logic)
│   ├── documentController.js (Document Processing)
│   ├── userController.js (User Management)
│   └── noteController.js (Note Operations)
├── Services (External Integrations)
│   ├── geminiProcessor.js (Google Gemini AI Integration)
│   ├── mindMapService.js (Mind Map Generation)
│   ├── pdfParseService.js (PDF Text Extraction)
│   └── pdfExporter.js (PDF Report Generation)
├── Models (Data Schemas)
│   ├── User.js (User Account & Credits)
│   ├── Document.js (PDF Documents & AI Results)
│   └── Note.js (User Notes)
├── Middleware (Cross-cutting Concerns)
│   ├── authMiddleware.js (JWT Authentication)
│   ├── errorMiddleware.js (Global Error Handling)
│   └── uploadMiddleware.js (File Upload Handling)
└── Configuration
    ├── package.json (Dependencies)
    └── .env (Environment Variables)

### Backend Technologies
- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Web framework for API development
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: ODM for MongoDB schema management
- **JWT**: Token-based authentication
- **bcrypt**: Password hashing
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Morgan**: HTTP request logging

### Backend Key Features
- **RESTful API**: Well-structured endpoints for all operations
- **Authentication & Authorization**: Secure user access control
- **File Upload**: PDF document handling with validation
- **AI Integration**: Google Gemini API for content analysis
- **Error Handling**: Comprehensive error management and logging
- **Database Operations**: CRUD operations with data validation

## Data Architecture

### Database Schema Overview

```
MongoDB Collections
├── Users Collection
│   ├── _id (ObjectId)
│   ├── name (String)
│   ├── email (String, unique)
│   ├── password (String, hashed)
│   ├── credits (Number, default: 5)
│   ├── isSubscribed (Boolean)
│   └── createdAt (Date)
├── Documents Collection
│   ├── _id (ObjectId)
│   ├── user (ObjectId, ref: Users)
│   ├── fileName (String)
│   ├── fileUrl (String)
│   ├── pdfMetadata (Object)
│   │   ├── pages (Number)
│   │   ├── fileSize (String)
│   │   └── extractedText (String)
│   ├── processingStatus (String: pending/completed/failed)
│   ├── processingType (String: summary/quiz/comprehensive)
│   ├── summary (Object: short/medium/detailed)
│   ├── keyPoints (Array<String>)
│   ├── quizzes (Array<Object>)
│   ├── quizResults (Array<Object>)
│   ├── generatedReports (Array<Object>)
│   ├── processingDetails (Object)
│   └── createdAt (Date)
└── Notes Collection
    ├── _id (ObjectId)
    ├── user (ObjectId, ref: Users)
    ├── document (ObjectId, ref: Documents)
    ├── content (String)
    ├── type (String: text/mindmap)
    └── createdAt (Date)

### Data Relationships
- **Users → Documents**: One-to-Many (User can have multiple documents)
- **Users → Notes**: One-to-Many (User can have multiple notes)
- **Documents → Notes**: One-to-Many (Document can have multiple notes)
- **Documents → Quiz Results**: One-to-Many (Document can have multiple quiz attempts)

### Data Storage Strategy
- **File Storage**: Uploaded PDFs stored in `/uploads` directory
- **Generated Reports**: AI-generated PDFs stored in `/uploads/generated-reports`
- **Database Indexing**: Optimized queries with user-based indexing
- **Data Validation**: Schema-level validation with Mongoose

## AI Integration Architecture

```
AI Integration Flow
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PDF Upload    │───►│  Text Extraction │───►│  Gemini AI      │
│                 │    │  (pdf-parse)     │    │  Processing     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Response   │◄───│  Prompt          │◄───│  Content        │
│   Processing    │    │  Engineering     │    │  Analysis       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Storage  │    │  Report          │    │  User Feedback  │
│   (MongoDB)     │    │  Generation      │    │  & Analytics    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### AI Processing Pipeline
1. **Document Ingestion**: PDF upload and initial validation
2. **Text Extraction**: Convert PDF to machine-readable text
3. **Content Analysis**: Gemini AI analyzes document structure and content
4. **Feature Generation**:
   - **Summarization**: Short, medium, and detailed summaries
   - **Quiz Generation**: Multiple-choice questions with explanations
   - **Mind Map Creation**: Hierarchical concept visualization
   - **Q&A Preparation**: Context-aware question answering
5. **Result Storage**: Save processed data to database
6. **Report Generation**: Create downloadable PDF reports

### AI Service Components
- **Gemini Processor**: Main AI service handling all Gemini API interactions
- **Prompt Engineering**: Specialized prompts for different analysis types
- **Response Parsing**: Convert AI responses to structured data
- **Error Handling**: Graceful degradation for AI service failures

### AI Integration Technologies
- **Google Generative AI SDK**: Official Gemini API client
- **Natural Language Processing**: Text analysis and processing
- **PDF Parsing**: Extract text and metadata from PDF files
- **Data Serialization**: Convert AI responses to database-compatible format

## Security Architecture

```
Security Layers
┌─────────────────────────────────────────────────────────────┐ 
│                    Client-Side Security                     │
├─────────────────────────────────────────────────────────────┤
│  • Input Validation     • XSS Protection     • CSRF Tokens  │
│  • Secure Headers       • Content Security   • Route Guards │
│                         • Policy (CSP)                      │
├─────────────────────────────────────────────────────────────┤
│                    API Security Layer                       │
├─────────────────────────────────────────────────────────────┤
│  • JWT Authentication   • Password Hashing  • Rate Limiting │
│  • Request Validation   • CORS Policy       • Error Handling│
├─────────────────────────────────────────────────────────────┤
│                    Data Security Layer                      │
├─────────────────────────────────────────────────────────────┤
│  • Data Encryption      • Access Control    • Audit Logging │
│  • Schema Validation    • Secure Queries    • Backup Security│
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Security                  │
├─────────────────────────────────────────────────────────────┤
│  • Environment Variables• Secure Dependencies• File Upload  │
│  • HTTPS/TLS           • Server Hardening   • Monitoring    │
└─────────────────────────────────────────────────────────────┘
```

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with refresh token rotation
- **Password Security**: bcrypt hashing with salt rounds
- **Route Protection**: Middleware-based access control
- **Session Management**: Secure token storage and validation

### Data Protection
- **Input Sanitization**: Prevent injection attacks
- **File Upload Security**: Type validation and size limits
- **API Rate Limiting**: Prevent abuse and DoS attacks
- **Error Handling**: Secure error messages without data leakage

### Infrastructure Security
- **Environment Variables**: Sensitive data management
- **HTTPS/TLS**: Encrypted data transmission
- **CORS Configuration**: Controlled cross-origin access
- **Dependency Security**: Regular security audits and updates

## Deployment Architecture

```
Deployment Architecture
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────┐  │
│  │   Load Balancer │    │   Web Servers   │    │   CDN   │  │
│  │   (Nginx)       │───►│   (Node.js)     │───►│ (Cloud- │  │
│  │                 │    │                 │    │  flare) │  │
│  └─────────────────┘    └─────────────────┘    └─────────┘  │
│           │                       │                │        │
│           ▼                       ▼                ▼        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────┐  │
│  │   Database      │    │   File Storage  │    │   AI    │  │
│  │   (MongoDB      │    │   (Cloud)       │    │   API   │  │
│  │    Atlas)       │    │                 │    │         │  │
│  └─────────────────┘    └─────────────────┘    └─────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Monitoring & Logging                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   App       │  │   Error     │  │   Analytics │          │
│  │   Metrics   │  │   Tracking  │  │   (GA)      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Strategy
- **Containerization**: Docker for consistent environments
- **Cloud Hosting**: Scalable cloud infrastructure (AWS/Azure/GCP)
- **Database**: MongoDB Atlas for managed NoSQL database
- **File Storage**: Cloud storage for uploaded files and reports
- **CDN**: Content delivery network for static assets
- **Load Balancing**: Distribute traffic across multiple instances

### CI/CD Pipeline
1. **Code Quality**: Automated testing and linting
2. **Build Process**: Automated build and dependency management
3. **Testing**: Unit tests, integration tests, and E2E tests
4. **Deployment**: Automated deployment to staging/production
5. **Monitoring**: Real-time monitoring and alerting

### Scalability Considerations
- **Horizontal Scaling**: Multiple server instances behind load balancer
- **Database Sharding**: Distribute data across multiple MongoDB instances
- **Caching**: Redis for session and data caching
- **CDN**: Global content delivery for improved performance

## Data Flow Diagrams

### User Registration & Authentication Flow

```
User Registration Flow
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Database   │
│             │    │             │    │             │
│ 1. Register │───►│ 2. Validate │───►│ 3. Store    │
│    Form     │    │    Data     │    │   User      │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 4. JWT Token      │ 5. Success        │
       ◄───────────────────┼───────────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐    ┌─────────────┐
│   Redirect  │    │   JWT       │
│   to Login  │    │   Stored    │
└─────────────┘    └─────────────┘
```

### Document Processing Flow

```
Document Upload & Processing Flow
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │   AI        │    │  Database   │
│             │    │             │    │  Service    │    │             │
│ 1. Upload   │───►│ 2. Validate │───►│ 3. Extract  │───►│ 4. Store    │
│    PDF      │    │    File     │    │    Text     │    │   Metadata  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ▲                   │                   │                   │
       │                   ▼                   ▼                   ▼
       │            ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
       │            │ 5. Process  │    │ 6. Generate │    │ 7. Update   │
       │            │   Content   │    │   Results   │    │   Document  │
       │            └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   ▼                   ▼                   ▼
       │            ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
       │            │ 8. Create   │    │ 9. Send     │    │ 10. Display │
       │            │   Report    │    │   Response  │    │    Results  │
       │            └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       └───────────────────┼───────────────────┼───────────────────┘
                           ▼                   ▼                   ▼
                    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                    │   Success   │    │   Error     │    │   Update    │
                    │  Response   │    │  Handling   │    │   Credits   │
                    └─────────────┘    └─────────────┘    └─────────────┘
```

## Component Interaction Diagrams

### Frontend Component Hierarchy

```
App Component Hierarchy
┌─────────────────────────────────────────────────────────────┐
│                        App.jsx                              │
├─────────────────────────────────────────────────────────────┤
│  ├── AuthContext (Global State)                             │
│  ├── ThemeContext (Global State)                            │
│  ├── Router (React Router)                                  │
│  │                                                          │
│  │  ├── Public Routes                                       │
│  │  │  ├── Home.jsx                                         │
│  │  │  ├── Login.jsx (Auth Components)                      │
│  │  │  └── Register.jsx (Auth Components)                   │
│  │  │                                                       │
│  │  └── Protected Routes (Require Auth)                     │
│  │     ├── Dashboard.jsx                                    │
│  │     │  ├── Dashboard Components                          │
│  │     │  │  ├── Analytics.jsx                              │
│  │     │  │  └── DocumentStats.jsx                          │
│  │     │  └── Common Components                             │
│  │     │     ├── Navbar.jsx                                 │
│  │     │     └── Footer.jsx                                 │
│  │     │                                                    │
│  │     ├── Upload.jsx                                       │
│  │     │  ├── UploadPDF Components                          │
│  │     │  │  ├── UploadPDF.jsx                              │
│  │     │  │  ├── PDFViewer.jsx                              │
│  │     │  │  └── ProcessingOptions.jsx                      │
│  │     │  └── Common Components                             │
│  │     │                                                    │
│  │     ├── Document.jsx                                     │
│  │     │  ├── Summary Components                            │
│  │     │  │  ├── ShortSummary.jsx                           │
│  │     │  │  ├── MediumSummary.jsx                          │
│  │     │  │  └── DetailedSummary.jsx                        │
│  │     │  ├── Quiz Components                               │
│  │     │  │  ├── QuizContainer.jsx                          │
│  │     │  │  ├── QuizGenerator.jsx                          │
│  │     │  │  └── QuizResult.jsx                             │
│  │     │  ├── MindMap Components                            │
│  │     │  │  ├── MindMap.jsx                                │
│  │     │  │  └── MindMapStudio.jsx                          │
│  │     │  └── Q&A Components                                │
│  │     │     ├── ChatBox.jsx                                │
│  │     │     └── QuestionInput.jsx                          │
│  │     │                                                    │
│  │     ├── Quiz.jsx                                         │
│  │     │  ├── QuizList Components                           │
│  │     │  │  ├── QuizList.jsx                               │
│  │     │  │  └── QuizPage.jsx                               │
│  │     │  └── QuizResult Components                         │
│  │     │     ├── QuizResultAnalysis.jsx                     │
│  │     │     └── QuizResultsAnalysis.jsx                    │
│  │     │                                                    │
│  │     ├── Profile.jsx                                      │
│  │     └── Settings.jsx                                     │
│  │                                                          │
│  └── Common Components (Used Across Pages)                  │
│     ├── Loader.jsx                                          │
│     ├── ProtectedRoute.jsx                                  │
│     └── Dropdown.jsx                                        │
└─────────────────────────────────────────────────────────────┘
```

### Backend API Interaction Flow

```
Backend API Architecture
┌─────────────────────────────────────────────────────────────┐
│                     Express Server                          │
├─────────────────────────────────────────────────────────────┤
│  ├── Global Middleware                                      │
│  │  ├── CORS                                                │
│  │  ├── JSON Parser                                         │
│  │  ├── Request Logger (Morgan)                             │
│  │  ├── Static File Serving                                 │
│  │  └── Security Headers (Helmet)                           │
│  │                                                          │
│  ├── Route Handlers                                         │
│  │  ├── /api/auth (Authentication)                          │
│  │  │  ├── POST /login                                      │
│  │  │  ├── POST /register                                   │
│  │  │  └── POST /logout                                     │
│  │  │                                                       │
│  │  ├── /api/documents (Document Management)                │
│  │  │  ├── GET / (List user documents)                      │
│  │  │  ├── POST /upload (Upload PDF)                        │
│  │  │  ├── GET /:id (Get document details)                  │
│  │  │  ├── POST /:id/process (Process document)             │
│  │  │  ├── POST /:id/quiz (Submit quiz answers)             │
│  │  │  └── DELETE /:id (Delete document)                    │
│  │  │                                                       │
│  │  ├── /api/users (User Management)                        │
│  │  │  ├── GET /profile                                     │
│  │  │  ├── PUT /profile                                     │
│  │  │  └── GET /credits                                     │
│  │  │                                                       │
│  │  └── /api/notes (Note Management)                        │
│  │     ├── GET / (List user notes)                          │
│  │     ├── POST / (Create note)                             │
│  │     ├── PUT /:id (Update note)                           │
│  │     └── DELETE /:id (Delete note)                        │
│  │                                                          │
│  ├── Controllers (Business Logic)                           │
│  │  ├── authController.js                                   │
│  │  ├── documentController.js                               │
│  │  ├── userController.js                                   │
│  │  └── noteController.js                                   │
│  │                                                          │
│  ├── Services (External Integrations)                       │
│  │  ├── geminiProcessor.js (AI Processing)                  │
│  │  ├── mindMapService.js (Mind Map Generation)             │
│  │  ├── pdfParseService.js (PDF Text Extraction)            │
│  │  └── pdfExporter.js (PDF Report Generation)              │
│  │                                                          │
│  ├── Models (Data Layer)                                    │
│  │  ├── User.js                                             │
│  │  ├── Document.js                                         │
│  │  └── Note.js                                             │
│  │                                                          │
│  └── Middleware (Cross-cutting)                             │
│     ├── authMiddleware.js (Authentication)                  │
│     ├── errorMiddleware.js (Error Handling)                 │
│     └── uploadMiddleware.js (File Upload)                   │
└─────────────────────────────────────────────────────────────┘
```

### AI Processing Sequence

```
AI Processing Workflow
┌─────────────────────────────────────────────────────────────┐
│                 Document Processing Pipeline                │
├─────────────────────────────────────────────────────────────┤
│  1. File Upload                                             │
│     ├── Validate file type and size                         │
│     ├── Store file in uploads directory                     │
│     └── Create document record in database                  │
│                                                             │
│  2. Text Extraction                                         │
│     ├── Parse PDF using pdf-parse library                   │
│     ├── Extract text content and metadata                   │
│     └── Store extracted text in document record             │
│                                                             │
│  3. AI Content Analysis                                     │
│     ├── Prepare prompts for different analysis types        │
│     ├── Call Google Gemini API                              │
│     └── Process AI responses into structured data           │
│                                                             │
│  4. Feature Generation                                      │
│     ├── Generate summaries (short/medium/detailed)          │
│     ├── Create quiz questions with answers                  │
│     ├── Build mind map structure                            │
│     └── Prepare Q&A context                                 │
│                                                             │
│  5. Result Storage                                          │
│     ├── Update document record with AI results              │
│     ├── Mark processing status as completed                 │
│     └── Deduct user credits                                 │
│                                                             │
│  6. Report Generation                                       │
│     ├── Create PDF reports using pdfkit                     │
│     ├── Store reports in generated-reports directory        │
│     └── Update document with report references              │
│                                                             │
│  7. Response Delivery                                       │
│     ├── Send processing results to frontend                 │
│     ├── Provide download links for reports                  │
│     └── Update user interface with new data                 │
└─────────────────────────────────────────────────────────────┘
```

This architecture provides a comprehensive, scalable, and secure platform for AI-powered document analysis, enabling users to transform static PDFs into interactive learning experiences through summarization, quizzing, mind mapping, and Q&A capabilities.
