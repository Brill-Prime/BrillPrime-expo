---
trigger: always_on
description: 07 auxly document progress
---

---
description: Auxly Rule #7 - Document progress and decisions using mcp_extension-auxly_auxly_add_comment
alwaysApply: true
priority: 1
---

# 🔒 AUXLY RULE #7: DOCUMENT PROGRESS

**MANDATORY: Add comments using `mcp_extension-auxly_auxly_add_comment` throughout work**

---

## ✅ WHEN TO ADD COMMENTS:

```typescript
// 1. Starting major phase
await mcp_extension-auxly_auxly_add_comment({
  taskId: "X",
  type: "note",
  content: "Starting Phase 1: Backend API implementation."
});

// 2. Completing a phase
await mcp_extension-auxly_auxly_add_comment({
  taskId: "X",
  type: "note",
  content: "✅ Phase 1 complete: Backend API with /trial/verify endpoint."
});

// 3. Encountering issues
await mcp_extension-auxly_auxly_add_comment({
  taskId: "X",
  type: "note",
  content: "⚠️ Issue: CSP blocking images. Need to update img-src policy."
});

// 4. Task complete
await mcp_extension-auxly_auxly_add_comment({
  taskId: "X",
  type: "result",
  content: "✅ Task complete! All 7 workflow rules created."
});

// 5. Manual steps needed
await mcp_extension-auxly_auxly_add_comment({
  taskId: "X",
  type: "manualsetup",
  content: "⚙️ MANUAL SETUP:\n1. Run: npm run migrate:up\n2. Restart server"
});
```

---

## 📋 COMMENT TYPES:

### 1. **`note`** - Progress updates and decisions
Use `mcp_extension-auxly_auxly_add_comment` with `type: "note"` for:
- Phase completions
- Important decisions
- Issues and resolutions

### 2. **`result`** - Task completion summary
Use `mcp_extension-auxly_auxly_add_comment` with `type: "result"` for:
- Final task summary
- What was accomplished
- Files changed

### 3. **`manualsetup`** - Steps user must perform
Use `mcp_extension-auxly_auxly_add_comment` with `type: "manualsetup"` for:
- Database migrations
- Server restarts
- Configuration changes

---

## Complete Documentation Example:

```typescript
// PHASE 1: Starting
await mcp_extension-auxly_auxly_add_comment({
  taskId: "14",
  type: "note",
  content: "Starting hybrid trial system. Approach: Local trial + backend sync."
});

// PHASE 2: Backend complete
await mcp_extension-auxly_auxly_add_comment({
  taskId: "14",
  type: "note",
  content: "✅ Phase 1: Backend API complete\n- Database migration\n- /trial/verify endpoint"
});

// PHASE 3: Frontend complete
await mcp_extension-auxly_auxly_add_comment({
  taskId: "14",
  type: "note",
  content: "✅ Phase 2: Frontend sync complete\n- 1-hour interval\n- 24-hour grace period"
});

// PHASE 4: Manual steps
await mcp_extension-auxly_auxly_add_comment({
  taskId: "14",
  type: "manualsetup",
  content: "⚙️ MANUAL STEPS:\n\n1. Run migration:\n   cd backend\n   npm run migrate:up\n\n2. Restart:\n   npm run dev"
});

// PHASE 5: Complete
await mcp_extension-auxly_auxly_add_comment({
  taskId: "14",
  type: "result",
  content: "🎉 COMPLETE!\n\n✅ Backend API (293 lines)\n✅ Frontend sync (210 lines)\n✅ Testing guide"
});
```

---

## ❌ FORBIDDEN:

- Working without calling `mcp_extension-auxly_auxly_add_comment`
- Not documenting phases
- Not explaining decisions
- Missing manual setup instructions

---

## Why This Rule Exists:

✅ **Context** - User understands progress  
✅ **Decisions documented** - Why things were done  
✅ **Easy pickup** - Continue work later  
✅ **Professional** - Complete documentation

---

**ENFORCEMENT: Call `mcp_extension-auxly_auxly_add_comment` at major milestones. Document decisions. Explain manual steps. ALWAYS.**
