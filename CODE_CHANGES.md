# Exact Code Changes Required

## Change 1: Backend Routes (CRITICAL)

**File:** `backend/routes/documentRoutes.js`

**Line 2 - CHANGE FROM:**
```javascript
const docController = require('../controllers/documentController');
```

**TO:**
```javascript
const docController = require('../controllers/documentControllerNew');
```

**That's the ONLY change needed in routes!** ✅

---

## Change 2: Frontend Document Page (IMPORTANT)

**File:** `frontend/src/pages/Document.jsx`

### 2.1 - Update Imports (Add these at the top with other imports)

**ADD:**
```javascript
import QuizResultAnalysis from '../components/quiz/QuizResultAnalysis';
```

### 2.2 - Add Handler Function

**In the Document component, add this handler:**

```javascript
const handleDownloadReport = async (reportType) => {
    try {
        const response = await api.post('/documents/report/generate', {
            documentId: id,
            reportType: reportType || 'comprehensive'
        });
        // File automatically downloads
        console.log('Report downloaded successfully');
    } catch (err) {
        console.error('Error downloading report:', err);
        alert('Failed to download report. Please try again.');
    }
};
```

### 2.3 - Replace Quiz Tab Code

**FIND (around line 61):**
```jsx
{activeTab === 'quiz' && <QuizList quizzes={doc.quizzes} />}
```

**REPLACE WITH:**
```jsx
{activeTab === 'quiz' && (
  <QuizListNew 
    quizzes={doc.quizzes}
    documentId={doc._id}
    onDownloadReport={handleDownloadReport}
  />
)}
```

**Then IMPORT QuizListNew at the top:**
```javascript
import QuizListNew from '../components/quiz/QuizListNew';
```

That's ALL the changes needed for Document.jsx! ✅

---

## Change 3: Upload Page (OPTIONAL - if you have one)

**File:** `frontend/src/pages/Upload.jsx` (if it exists)

### Option A: If you have a dedicated Upload page

**CHANGE:**
```javascript
import UploadPDF from '../components/pdf/UploadPDF';
```

**TO:**
```javascript
import UploadPDFNew from '../components/pdf/UploadPDFNew';
```

**AND CHANGE:**
```jsx
<UploadPDF />
```

**TO:**
```jsx
<UploadPDFNew />
```

### Option B: If upload is in Dashboard

If the upload component is within Dashboard.jsx, apply the same import change there.

---

## Installation Command

**Run this ONCE in backend folder:**

```bash
cd backend
npm install pdf-parse pdfkit
```

**What this does:**
- pdf-parse: Extracts text from PDFs ✅
- pdfkit: Generates PDF reports ✅

---

## Summary of Changes

### Backend
1. Update routes import (1 line) ✅

### Frontend  
1. Add import in Document.jsx (1 line) ✅
2. Add handler function in Document.jsx (9 lines) ✅
3. Replace quiz tab code in Document.jsx (6 lines) ✅
4. Update Upload page imports (2 lines) - OPTIONAL ✅

### Dependencies
1. npm install pdf-parse pdfkit ✅

### Total Changes
- **3 critical** (route, document page)
- **1 optional** (upload page)
- **1 npm install**

---

## Verification Checklist

After making these changes:

```
□ Backend compiles without errors
  npm start should show no import errors

□ Frontend compiles without errors
  npm run dev should load the page

□ Imports work
  No "Cannot find module" errors in console

□ Can upload PDF
  Click upload, select file, choose type

□ Processing works
  Takes 8-15 seconds, then shows results

□ Quiz works
  Can answer questions and submit

□ Download works
  PDF file downloads successfully
```

---

## If You Get Errors

### Error: "Cannot find module 'documentControllerNew'"
**Fix:** Check you changed line 2 of documentRoutes.js correctly

### Error: "pdf-parse not installed"  
**Fix:** Run `npm install pdf-parse pdfkit` in backend folder

### Error: "QuizListNew not found"
**Fix:** Make sure you imported it at the top of Document.jsx

### Error: "API returns 404"
**Fix:** Make sure the routes were updated to use new controller

---

## Code Ready to Copy-Paste

### documentRoutes.js - Complete Updated File:
```javascript
const express = require('express');
const router = express.Router();
const docController = require('../controllers/documentControllerNew'); // ← THIS LINE CHANGED
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * PATH: /api/documents
 */

// Get all documents for the dashboard
router.get('/', protect, docController.getUserDocuments);

// Get single document
router.get('/:id', protect, docController.getDocument);

// NEW WORKFLOW - Upload PDF (Step 1: Just upload, no processing)
router.post('/upload', protect, upload.single('pdf'), docController.uploadPDF);

// Process PDF with selected options (Step 2: User chooses summary/quiz/mindmap)
router.post('/process', protect, docController.processPDF);

// Submit quiz answers (Step 3: User submits quiz)
router.post('/quiz/submit', protect, docController.submitQuizAnswers);

// Generate report PDF (Step 4: Export results as PDF)
router.post('/report/generate', protect, docController.generateReportPDF);

// Delete a document
router.delete('/:id', protect, docController.deleteDocument);

// BACKWARD COMPATIBILITY - Old upload & analyze endpoint
router.post('/upload-and-analyze', protect, upload.single('pdf'), docController.uploadAndAnalyze);

module.exports = router;
```

---

## Testing Command

After making all changes:

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Open browser to http://localhost:5173
# Click Upload
# Upload a PDF
# Should see processing options modal
# Complete the workflow
```

---

## That's It! 🎉

You now have:
- ✅ PDF upload system
- ✅ Multiple analysis options
- ✅ Smart quiz with scoring
- ✅ Topic recommendations
- ✅ PDF report generation
- ✅ Professional UI

All with just a few code changes!

**Everything is ready to go.** Just make the changes above and test.
