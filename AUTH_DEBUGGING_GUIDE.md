# Authentication Debugging Guide

## 🔍 Overview
This guide helps you debug login and registration issues by understanding the authentication flow and interpreting console output.

---

## 📋 Step-by-Step Testing Guide

### Step 1: Verify Backend Is Running
**What to do:**
1. Open terminal in `backend/` folder
2. Run: `npm start`
3. Watch for these messages:

```
✅ MongoDB Connected: Study Vault is Ready
🚀 LearnSphere-AI Backend spinning on http://localhost:3000
```

**If you see these:** ✅ Backend is ready
**If you don't see these:** ❌ Check MongoDB connection (see Troubleshooting section)

---

### Step 2: Test Registration Flow

#### Method 1: Using cURL (Terminal)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123"}'
```

#### Method 2: Using Postman
1. Create new POST request to: `http://localhost:3000/api/auth/register`
2. Headers: `Content-Type: application/json`
3. Body (raw JSON):
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "testpass123"
}
```
4. Click Send

#### Expected Backend Console Output:
```
📝 REGISTER ATTEMPT: { name: 'Test User', email: 'test@example.com', password: '***' }
✅ User created: { id: 'ObjectId...', email: 'test@example.com' }
🔑 Token generated for new user
```

#### Expected Response:
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "credits": 5,
    "isSubscribed": false
  }
}
```

---

### Step 3: Test Login Flow

#### Method 1: Using cURL (Terminal)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

#### Method 2: Using Postman
1. Create new POST request to: `http://localhost:3000/api/auth/login`
2. Headers: `Content-Type: application/json`
3. Body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "testpass123"
}
```
4. Click Send

#### Expected Backend Console Output (Successful):
```
🔐 LOGIN ATTEMPT: { email: 'test@example.com', password: '***' }
👤 User found: test@example.com (exists)
🔑 Password check: CORRECT
✅ Login successful for: test@example.com
```

#### Expected Response (Successful):
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "credits": 5,
    "isSubscribed": false
  }
}
```

---

## 🐛 Troubleshooting Chart

### Problem: Registration Failed - Email Already Exists

**Backend Console Output:**
```
📝 REGISTER ATTEMPT: { name: '...', email: '...', password: '***' }
❌ REGISTRATION ERROR: E11000 duplicate key error
```

**Response:**
```json
{
  "status": "fail",
  "message": "Email already exists"
}
```

**Solutions:**
1. Use a different email address
2. Or delete existing email from database:
   - Connect to MongoDB
   - Run: `db.users.deleteOne({email: "oldtest@example.com"})`
   - Try registration again

---

### Problem: Registration Failed - Missing Required Fields

**Backend Console Output:**
```
📝 REGISTER ATTEMPT: { name: undefined, email: 'test@example.com', password: '***' }
❌ Missing required fields
```

**Response:**
```json
{
  "message": "Please provide name, email and password"
}
```

**Solutions:**
- Make sure all three fields are sent: `name`, `email`, `password`
- Check your frontend form doesn't have empty fields
- Verify API call includes all fields

---

### Problem: Registration Failed - Password Too Short

**Backend Console Output:**
```
📝 REGISTER ATTEMPT: { name: 'Test', email: 'test@example.com', password: '***' }
❌ Password too short
```

**Response:**
```json
{
  "message": "Password must be at least 8 characters"
}
```

**Solutions:**
- Password must be at least 8 characters
- Try: `password: "testpass123"` (12 characters)

---

### Problem: Login Failed - User Not Found

**Backend Console Output:**
```
🔐 LOGIN ATTEMPT: { email: 'nonexistent@example.com', password: '***' }
👤 User found: NOT FOUND
❌ User not found with email: nonexistent@example.com
```

**Response:**
```json
{
  "message": "Invalid email or password"
}
```

**Solutions:**
- Register user first before trying to login
- Check email spelling matches exactly
- Make sure you're using email, not username

---

### Problem: Login Failed - Wrong Password

**Backend Console Output:**
```
🔐 LOGIN ATTEMPT: { email: 'test@example.com', password: '***' }
👤 User found: test@example.com (exists)
🔑 Password check: INCORRECT
❌ Password mismatch for user: test@example.com
```

**Response:**
```json
{
  "message": "Invalid email or password"
}
```

**Solutions:**
- Re-check the password you're entering
- Try registering with a new password you're sure about
- Avoid spaces or special characters if unsure

---

### Problem: MongoDB Connection Failed

**Backend Console Output:**
```
mongodb Connection Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Or:**
```
mongodb Connection Error: Server selection timed out after 10000ms
```

**Solutions:**

#### If using local MongoDB:
1. Check if MongoDB is running:
   ```bash
   # Windows
   tasklist | findstr mongo
   
   # Mac/Linux
   ps aux | grep mongo
   ```

2. If not running, start MongoDB:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

#### If using MongoDB Atlas (Cloud):
1. Check `process.env.MONGODB_URI` contains correct connection string
2. Verify IP whitelist in MongoDB Atlas allows your IP
3. Verify username/password are correct

---

## 🧪 Complete Test Sequence

Run this full sequence to verify everything works:

```bash
# 1. Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","password":"alice12345"}'

# 2. Check backend for: "✅ User created"

# 3. Try to register same email again (should fail)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"alice@test.com","password":"bob12345"}'

# 4. Check backend for: "❌ Email already exists" or "E11000 duplicate key"

# 5. Login with correct password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"alice12345"}'

# 6. Check backend for: "✅ Login successful"

# 7. Try login with wrong password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"wrongpass123"}'

# 8. Check backend for: "❌ Password mismatch"
```

**If all outputs match expected patterns:** ✅ Authentication is working correctly

---

## 📊 Console Output Reference

### Registration Console Logs
| Pattern | Meaning | Status |
|---------|---------|--------|
| `📝 REGISTER ATTEMPT:` | Registration started | ℹ️ Info |
| `❌ Missing required fields` | name/email/password missing | ❌ Error |
| `❌ Password too short` | Password < 8 characters | ❌ Error |
| `✅ User created:` | User saved to database | ✅ Success |
| `🔑 Token generated` | JWT token created | ✅ Success |
| `❌ REGISTRATION ERROR:` | Database/other error | ❌ Error |

### Login Console Logs
| Pattern | Meaning | Status |
|---------|---------|--------|
| `🔐 LOGIN ATTEMPT:` | Login started | ℹ️ Info |
| `❌ Missing email or password` | Missing credentials | ❌ Error |
| `👤 User found: NOT FOUND` | Email not in database | ❌ Error |
| `🔑 Password check: CORRECT` | Password matches | ✅ Success |
| `🔑 Password check: INCORRECT` | Password doesn't match | ❌ Error |
| `✅ Login successful` | Authentication complete | ✅ Success |
| `🚨 Login error:` | Unexpected error | ❌ Error |

---

## 🔐 Frontend Login Testing

### In React Frontend (Register.jsx / Login.jsx)

1. **Open Developer Console** (F12 or Right-click → Inspect → Console)
2. **Try to register/login**
3. **Watch for these in Developer Console:**

```javascript
// Successful registration:
{status: 'success', token: 'eyJ...', user: {...}}

// Failed registration:
Error: Email already exists

// Successful login:
{status: 'success', token: 'eyJ...', user: {...}}

// Failed login:
Error: Invalid email or password
```

4. **Check if token is stored:**
   - In Console, run: `localStorage.getItem('token')`
   - Should return JWT token starting with `eyJ`

---

## ✅ Verify Everything Is Working

Once all tests pass, verify end-to-end:

1. ✅ Can register with new email
2. ✅ Cannot register twice with same email
3. ✅ Can login with correct email + password
4. ✅ Cannot login with wrong password
5. ✅ Token is stored in localStorage
6. ✅ Backend logs show all expected debug messages

---

## 📞 If Still Having Issues

If tests don't match expected output, check:

1. **Backend terminal shows expected console logs:**
   - Copy exact log output
   - Compare with Reference Table above
   - Identify which phase is failing

2. **MongoDB is actually running:**
   - Backend should show: `✅ MongoDB Connected: Study Vault is Ready`
   - If not: See MongoDB Connection Failed section

3. **Frontend is sending correct data:**
   - Check network tab (F12 → Network)
   - Look for POST requests to `/api/auth/login` or `/api/auth/register`
   - Check Request → Payload to verify email/password are correct

4. **Environment variables are set:**
   - `.env` file should have: `JWT_SECRET`, `JWT_EXPIRES_IN`, `MONGODB_URI`
   - Check with: `echo $JWT_SECRET` (Linux/Mac) or `echo %JWT_SECRET%` (Windows)

---

## 🎯 Next Steps After Auth Works

Once authentication is working:

1. Test PDF upload and improved roadmap generation (/api/v2/roadmap/generate-improved)
2. Test quiz generation (/api/quizzes)
3. Test note creation (/api/notes)
4. Test todo features (/api/todos)

