# 🚀 Quick Roadmap Testing Guide

**Status**: Roadmap generation has been refactored to use smaller, sequential API calls for better reliability.

## 3 Ways to Test Roadmap Generation

### 1️⃣ **Local Node.js Test** (Fastest)
```bash
cd backend
node test-roadmap.js uploads/sample.pdf beginner
```
**Output**: See all generation steps with timing and stats
**Best for**: Verifying backend service works independently

### 2️⃣ **Browser Console Test** (Easy)
1. Open the app and login
2. Open DevTools (F12) → Console tab
3. Copy content from `API_TEST_CONSOLE.js` into console OR run:
```javascript
testRoadmapAPI(sampleContent, 'beginner')
```
**Output**: Formatted stats with topics, phases, modules, lessons
**Best for**: Testing with browser context and authentication

### 3️⃣ **Full UI Test** (Realistic)
1. Upload a PDF normally through the app
2. Select "Create Roadmap"
3. Open DevTools Console to see logs

---

## What Should Work Now ✅

After the fixes, you should see:

```
========== ROADMAP GENERATION STARTED ==========
📚 Step 1: Extracting main topics from content...
✅ Found 5-8 topics

🎯 Step 2: Generating learning phases...
✅ Created 3-4 phases (depends on level)

🔗 Step 3: Building learning modules...
✅ Created modules (2-3 per phase)

📖 Step 4: Generating lessons...
✅ Created lessons (3-4 per module)

✅ ROADMAP GENERATION COMPLETE
```

## Expected Results by Learner Level

| Level | Phases | Modules | Lessons | Hours |
|-------|--------|---------|---------|-------|
| Beginner | 3 | 6-9 | 18-27 | 24 |
| Intermediate | 4 | 8-12 | 24-36 | 36 |
| Advanced | 4 | 8-12 | 24-36 | 48 |

## Troubleshooting

### If Roadmap Still Empty (0 phases):

**Step 1**: Check API Key
```bash
# In backend/.env
echo $GEMINI_API_KEY  # Should be populated
```

**Step 2**: Verify PDF Extraction
```bash
# Run backend test
node test-roadmap.js uploads/sample.pdf beginner
# Watch for Step 1 output - should show 5-8 topics
```

**Step 3**: Check MongoDB Document
```javascript
// In MongoDB Compass
// Find document and check enhancedRoadmap field
// Should have: mainTopics[], learningPath.phases[]
```

**Step 4**: Read Full Debug Guide
```
See: ROADMAP_DEBUG_GUIDE.md
```

## Key Files Modified

- ✅ `backend/services/roadmapService.js` - Modular generation
- ✅ `backend/controllers/documentControllerNew.js` - Better error handling
- ✅ `backend/routes/documentRoutes.js` - Added test endpoint
- ✅ `test-roadmap.js` - Local testing script
- ✅ `ROADMAP_DEBUG_GUIDE.md` - Comprehensive debugging

## What Changed?

**Before** (Empty roadmaps):
- One massive prompt (400+ lines)
- Complex JSON parsing
- Silent failures

**After** (Working roadmaps):
- 5 smaller, focused prompts
- Step-by-step generation
- Comprehensive logging
- Fallback defaults

---

## Next: Full Integration Test

Once local test works:
1. Upload a PDF through the app
2. Open DevTools Console
3. Watch logs show roadmap generation in real-time
4. Verify roadmap appears in UI

**Still having issues?** Check [ROADMAP_DEBUG_GUIDE.md](./ROADMAP_DEBUG_GUIDE.md)
