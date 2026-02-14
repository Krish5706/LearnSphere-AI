# ⚡ Quick Start Guide - Authentication Fixed

## 🎯 What Was Fixed

1. **API Path Bug** - Frontend was calling `/api/api/auth/...` instead of `/api/auth/...` ✅ FIXED
2. **Missing Debug Logs** - No way to diagnose auth failures ✅ ADDED DETAILED LOGS  
3. **Duplicate Functions** - authcontroller.js had duplicate getMe ✅ CLEANED UP

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Start the Backend
```bash
cd backend
npm start
```

Wait for this message:
```
✅ MongoDB Connected: Study Vault is Ready
🚀 LearnSphere-AI Backend spinning on http://localhost:3000
```

### Step 2: Test Authentication with Script
```bash
# In a new terminal, in the backend folder
node auth-test.js
```

You should see:
```
=== LearnSphere-AI Auth Test Suite ===

✅ Register new user with valid credentials
✅ Registration returns correct user fields
✅ Cannot register with same email twice
✅ Login with correct credentials
✅ Login returns correct response structure
✅ Login fails with wrong password
✅ Login fails with non-existent email
✅ Token can be used for authenticated requests
✅ Invalid token is rejected
✅ Registration rejects missing name
✅ Registration rejects short password
✅ Registration rejects invalid email

=== Test Results Summary ===
Total Tests: 12
Passed: 12
Failed: 0
Success Rate: 100%

✨ All tests passed! Authentication system is working correctly.
```

If you see **100% success**, jump to Step 4 ✅

### Step 3: If Tests Fail

**Check Backend Console:**
Look for these debug logs in backend terminal:

| What You See | What It Means |
|---|---|
| `📝 REGISTER ATTEMPT:` | Registration started |
| `✅ User created:` | User successfully saved |
| `🔐 LOGIN ATTEMPT:` | Login started |
| `👤 User found: NOT FOUND` | Email doesn't exist |
| `🔑 Password check: INCORRECT` | Wrong password entered |

**Most Common Issues:**

1. **"MongoDB Connection Error"** 
   - Start MongoDB: `net start MongoDB` (Windows)
   - Or use MongoDB Atlas (cloud) via `.env` file

2. **"Email already exists"**
   - Use a different test email, or delete old data from MongoDB

3. **Port 3000 already in use**
   - Kill process: `netstat -ano | findstr :3000` then `taskkill /PID [PID] /F`

### Step 4: Start Frontend
```bash
cd forntend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Step 5: Test Registration in Browser
1. Go to `http://localhost:5173`
2. Click "Create Account"
3. Fill in:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Password: `password12345` (at least 8 chars)
4. Click "Join LearnSphere"
5. Should redirect to Dashboard ✅

### Step 6: Test Login
1. Click "Log In"
2. Enter:
   - Email: `john@example.com`
   - Password: `password12345`
3. Click "Sign In"
4. Should redirect to Dashboard ✅

---

## 📊 Quick Verification Checklist

- [ ] Backend running (`npm start`)
- [ ] MongoDB connected (`✅ MongoDB Connected` in terminal)
- [ ] Auth test passes (`node auth-test.js` shows 100%)
- [ ] Frontend running (`npm run dev`)
- [ ] Can register in UI
- [ ] Can login in UI
- [ ] Token stored in browser localStorage
- [ ] Dashboard shows after login

---

## 🐛 Debugging Commands

**List all users in database:**
```bash
mongosh
use learnsphere
db.users.find().pretty()
```

**Delete a specific user:**
```bash
db.users.deleteOne({email: "john@example.com"})
```

**Clear all users (careful!):**
```bash
db.users.deleteMany({})
```

**Check if token is stored:**
- F12 in browser
- Console tab
- Run: `localStorage.getItem('token')`
- Should show a long JWT starting with `eyJ`

---

## 📱 API Endpoints Reference

### Register
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password12345"
}

Response:
{
  "status": "success",
  "token": "eyJ...",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "credits": 5 }
}
```

### Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password12345"
}

Response:
{
  "status": "success",
  "token": "eyJ...",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "credits": 5 }
}
```

### Get Current User
```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer eyJ...

Response:
{
  "id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "credits": 5,
  "isSubscribed": false
}
```

---

## 🎯 Now That Auth Works...

### Test Improved Roadmap Generation:
1. Upload a PDF via the UI
2. System will use `/api/v2/roadmap/generate-improved` endpoint
3. Should generate dynamic topics from PDF (not generic "Learning Subject")
4. Topics should be specific to the document content

### Test Quiz Generation:
1. After roadmap generated
2. Quizzes should be created from the PDF content
3. Questions should be relevant to document topics

### Next Steps:
- See [IMPROVED_ROADMAP_GUIDE.md](IMPROVED_ROADMAP_GUIDE.md) for PDF processing
- See [AUTH_DEBUGGING_GUIDE.md](AUTH_DEBUGGING_GUIDE.md) for detailed auth troubleshooting
- See [AUTH_FIX_SUMMARY.md](AUTH_FIX_SUMMARY.md) for what was fixed

---

## 💡 Pro Tips

1. **Keep backend terminal visible** - Debug logs appear there
2. **Use F12 Network tab** - Watch API requests/responses
3. **Check localStorage** - Confirm token is stored after login
4. **Use Postman** - Test APIs independently from frontend
5. **Save test credentials** - Make registration/login testing easier

---

## ✅ Success Indicators

- ✅ Backend logs show detailed auth debug messages
- ✅ Authentication test script passes 100%
- ✅ Users can register and login in UI
- ✅ Token appears in browser localStorage
- ✅ Dashboard loads after authentication
- ✅ No 404 errors in network tab

---

## 📞 If Still Having Issues

1. **Collect Evidence:**
   - Screenshot of error message
   - Full backend console output
   - Network tab response (F12)
   - localStorage contents (`localStorage.getItem('token')`)

2. **Check These Files:**
   - `backend/controllers/authcontroller.js` - Has debug logging?
   - `forntend/src/services/authService.js` - Uses `/auth/register` (not `/api/auth/...`)?
   - `backend/server.js` - Has auth routes registered?

3. **Verify Configuration:**
   - `.env` has `JWT_SECRET` and `JWT_EXPIRES_IN`?
   - MongoDB URI correct for your setup?
   - Ports 3000 (backend) and 5173 (frontend) available?

---

## 🎉 Congratulations!

Once auth is working, you have:
- ✅ Secure user authentication
- ✅ Password hashing with bcrypt
- ✅ JWT token-based sessions
- ✅ Frontend integration ready
- ✅ MongoDB persistence

Next: Generate dynamic content from PDFs using our improved Gemini prompts!
