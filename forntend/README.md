LearnSphere-AI/
│
├── frontend/
├── backend/
├── .env.example
├── .gitignore
└── README.md

=========================================

frontend/
│
├── public/
│   ├── index.html
│   └── assets/
│       ├── images/
│       └── icons/
│
├── src/
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   │
│   │   ├── pdf/
│   │   │   ├── UploadPDF.jsx
│   │   │   ├── PDFList.jsx
│   │   │   └── PDFViewer.jsx
│   │   │
│   │   ├── summary/
│   │   │   ├── ShortSummary.jsx
│   │   │   ├── MediumSummary.jsx
│   │   │   └── DetailedSummary.jsx
│   │   │
│   │   ├── mindmap/
│   │   │   ├── MindMap.jsx
│   │   │   └── NodeTools.jsx
│   │   │
│   │   ├── qa/
│   │   │   ├── ChatBox.jsx
│   │   │   └── QuestionInput.jsx
│   │   │
│   │   ├── quiz/
│   │   │   ├── QuizGenerator.jsx
│   │   │   └── QuizResult.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── DocumentStats.jsx
│   │   │
│   │   └── common/
│   │       ├── Navbar.jsx
│   │       ├── Footer.jsx
│   │       ├── Loader.jsx
│   │       └── ProtectedRoute.jsx
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Upload.jsx
│   │   ├── Document.jsx
│   │   ├── Dashboard.jsx
│   │   └── Settings.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── pdfService.js
│   │   ├── aiService.js
│   │   └── quizService.js
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── utils/
│   │   ├── helpers.js
│   │   └── constants.js
│   │
│   ├── styles/
│   │   ├── global.css
│   │   └── theme.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── vite.config.js
└── package.json

================================

backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── db.js
│   │   ├── jwt.js
│   │   └── storage.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js
│   │   ├── Summary.js
│   │   ├── Quiz.js
│   │   └── Chat.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── pdfController.js
│   │   ├── aiController.js
│   │   ├── quizController.js
│   │   └── adminController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── pdfRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── quizRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── services/
│   │   ├── pdfExtractor.js
│   │   ├── ocrService.js
│   │   ├── summarizer.js
│   │   ├── mindMapGenerator.js
│   │   ├── qaEngine.js
│   │   └── embeddingService.js
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   └── validator.js
│   │
│   ├── app.js
│   └── server.js
│
├── uploads/
├── package.json
└── .env
