# 📍 How to Find Document/Resource IDs in LearnSphere-AI

## 🎯 Quick Answer

When creating a Todo task and linking it to a resource, you need to provide the **resource ID**. Here's where to find it:

---

## 📄 Finding Document ID

### Method 1: From Dashboard/Library
1. Go to **Dashboard** (click "Library" in navbar)
2. Find your PDF in the list
3. Click **"View Analysis"** to open the document
4. The URL will look like: `http://localhost:5173/document/67abc1234567890def123456`
5. **Copy the ID** from the URL (the long string after `/document/`)

### Method 2: Hover Over Document
1. On Dashboard, hover over a document
2. In some cases, the ID may be visible in a tooltip
3. Copy the ID to use in your task

### Visual Guide
```
Dashboard URL Structure:
http://localhost:5173/document/[THIS_IS_YOUR_ID]
                              ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

Example ID: 67abc1234567890def123456
Length: ~24 characters
Format: Alphanumeric string
```

---

## 🧠 Finding Quiz ID

### Where Quizzes Are Located
1. Go to a **Document** (click "View Analysis" from Dashboard)
2. Look for **"Generate Quiz"** or **"Quiz"** section
3. Take or review the quiz
4. The URL will show: `http://localhost:5173/quiz/67abc1234567890def123456`
5. **Copy the Quiz ID** from the URL

### Alternative: From Quiz Results
1. After completing a quiz
2. Check your quiz history/results page
3. Find the quiz ID there

---

## 📝 Finding Note ID

### Locating Your Notes
1. Go to a **Document** page
2. Look for **"Notes"** section or tab
3. Click on specific note
4. The note URL will contain the ID
5. **Copy the ID**

### Via Document Detail Page
1. From Dashboard, open any document
2. Navigate to Notes section
3. Find your note in the list
4. The ID should be visible or in the URL

---

## 🔍 Understanding ID Formats

### What Does an ID Look Like?

```
Valid ID Examples:
✅ 67abc1234567890def123456
✅ 64a1b2c3d4e5f6g7h8i9j0k1
✅ 5f4d3e2c1b0a9f8e7d6c5b4a

Invalid ID Examples:
❌ abc123 (too short)
❌ not-an-id (wrong format)
❌ random text (not proper format)
```

### ID Characteristics
- **Length**: 24 characters
- **Format**: Alphanumeric (letters + numbers)
- **Case-Sensitive**: Copy exactly as shown
- **No spaces**: One continuous string

---

## 🖼️ Step-by-Step Visual Walkthrough

### Step 1: Go to Dashboard
```
Navigation Bar
  [Logo] [Upload] [Library] [Tasks] [Profile]
                      ↓
                  Click HERE
```

### Step 2: View Document
```
Dashboard → Document List
┌─────────────────────────────┐
│ My Document.pdf             │
│ [View Analysis] button      │
└─────────────────────────────┘
      ↓ Click this button
```

### Step 3: Check URL
```
Browser Address Bar:
http://localhost:5173/document/67abc1234567890def123456
                               ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                          COPY THIS ID
```

### Step 4: Create Todo with ID
```
Add Task Form
  Title: "Read Chapter 5"
  Link to Resource: "PDF Document"
  Document ID: [Paste ID here] ← 67abc1234567890def123456
```

---

## 💡 Pro Tips

### Copy ID Easily
1. **Method A**: Click address bar → Select all ID → Copy
   ```
   http://localhost:5173/document/[SELECT & COPY]
   ```

2. **Method B**: Right-click in address bar → Copy
   ```
   Then paste into task form
   ```

3. **Method C**: Manual copy
   ```
   Click after the last "/" in URL
   Drag to select the entire ID
   Copy (Ctrl+C or Cmd+C)
   ```

### Verify Before Saving
- ✅ ID is 24 characters long
- ✅ No spaces in the ID
- ✅ All characters copied (no cut-off)
- ✅ Exact case matches (copy as shown)

---

## 🎓 Linking Resources to Tasks

### Why Link Resources?
```
Without Link:
  Task: "Read Chapter 5"
  Context: None

With Link:
  Task: "Read Chapter 5"
  Context: Linked to → My Document.pdf
  → Quick access to document while working on task
```

### How Linking Works
1. Create task with title & description
2. Choose "Link to Resource" option
3. Select resource type (Document/Quiz/Note)
4. Paste the ID
5. Click "Create Task"
6. Task now shows linked resource

---

## ❓ FAQs

**Q: Where do I find the ID?**
A: In the URL after you click "View Analysis" or open the resource. Look at the address bar.

**Q: What if the ID has special characters?**
A: MongoDB IDs use letters and numbers only. No special characters. If you see them, you may have copied wrong.

**Q: Can I create a task without linking?**
A: Yes! Linking is optional. You can leave it empty.

**Q: What if I paste wrong ID?**
A: The task will still save, but the link won't work. You can edit the task later to fix it.

**Q: Where exactly in URL is the ID?**
A: After the last "/" 
```
/document/[ID] ← here
/quiz/[ID] ← here
```

---

## 🚀 Quick Reference

| Resource Type | URL Example | Where to Find |
|---------------|------------|---|
| Document | `/document/:id` | Click "View Analysis" on Dashboard |
| Quiz | `/quiz/:id` | Complete a quiz, check results page |
| Note | `/notes/:id` | Open document → Notes section |

---

## 📱 Mobile Users

### On Mobile/Tablet
1. Open document/resource
2. Tap address bar to view full URL
3. Long-press on ID to copy
4. Paste into task form

### Easier Method
1. Don't worry about IDs on mobile
2. Create task without linking
3. Edit later from desktop if needed

---

## ✅ Summary

**To find a resource ID:**
1. Navigate to the resource (Document/Quiz/Note)
2. Look at the URL in address bar
3. Copy the long string at the end (after the /)
4. Paste into the task linking form
5. Done! ✨

**That's it!** Now you can link your tasks to study materials. 🎯

---

**Version**: 1.0.0  
**Last Updated**: January 31, 2026
