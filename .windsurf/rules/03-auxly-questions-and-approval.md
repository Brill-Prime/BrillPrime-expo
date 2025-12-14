---
trigger: always_on
description: 03 auxly questions and approval
---

---
description: Auxly Rule #3 - All questions via MCP, request approval for significant changes, never change status without confirmation
alwaysApply: true
priority: 1
---

# 🔒 AUXLY RULE #3: QUESTIONS AND APPROVAL

**MANDATORY: Ask questions via MCP, request approval for significant changes, confirm before status changes**

---

## PART A: ALL QUESTIONS VIA MCP - NEVER IN CHAT

### ✅ CORRECT WAY TO ASK:

```typescript
await mcp_extension-auxly_auxly_ask_question({
  taskId: "X",
  questionText: "Clear, specific question?",
  category: "TECHNICAL DECISION",
  priority: "high",
  context: "Detailed explanation...",
  options: [
    { label: "Option A", recommended: true },
    { label: "Option B" }
  ]
});
```

### 📋 QUESTION CATEGORIES:
- `TECHNICAL DECISION` - Technical choices
- `ARCHITECTURE` - Design decisions
- `UX` - User experience
- `CLARIFICATION` - Requirements unclear
- `APPROVAL REQUEST` - Significant changes

### ❌ FORBIDDEN IN CHAT:
- "What would you like me to do?"
- "Should I..."
- "Would you prefer..."

**ALL questions MUST use `mcp_extension-auxly_auxly_ask_question`**

---

## PART B: REQUEST APPROVAL FOR SIGNIFICANT CHANGES

### ⚠️ REQUIRES APPROVAL:

1. **Database schema changes**
2. **API breaking changes**
3. **Security changes**
4. **Architecture refactoring**
5. **Major dependencies**

```typescript
await mcp_extension-auxly_auxly_ask_question({
  taskId: "X",
  questionText: "Approve: Add 'trial_status' column to database?",
  category: "APPROVAL REQUEST",
  priority: "critical",
  context: "Database migration needed:\n- Add trial_start\n- Add trial_end\n- Add trial_status\n\nImpact: Requires npm run migrate:up",
  options: [
    { label: "✅ Approve", recommended: true },
    { label: "❌ Reject" }
  ]
});
```

---

## PART C: NEVER CHANGE STATUS WITHOUT CONFIRMATION

### ❌ WRONG:
```typescript
await mcp_extension-auxly_auxly_update_task({
  taskId: "X",
  status: "done"
});
// ❌ Must ask first!
```

### ✅ CORRECT:
```typescript
// STEP 1: Ask user
await mcp_extension-auxly_auxly_ask_question({
  taskId: "X",
  questionText: "Task complete. Mark as 'done'?",
  category: "APPROVAL REQUEST",
  priority: "medium",
  context: "All criteria met:\n- Feature working ✅\n- Files logged ✅",
  options: [
    { label: "✅ Mark as done", recommended: true },
    { label: "📝 Move to review" }
  ]
});

// STEP 2: After approval, update
await mcp_extension-auxly_auxly_update_task({
  taskId: "X",
  status: "done",
  aiWorkingOn: false
});
```

### 📋 STATUS TRANSITIONS:

| Transition | Requires Approval? |
|-----------|-------------------|
| `todo` → `in_progress` | ❌ NO |
| `in_progress` → `review` | ✅ YES |
| `in_progress` → `done` | ✅ YES |
| `review` → `done` | ✅ YES |
| Any → `cancelled` | ✅ YES |

---

## Why This Rule Exists:

✅ **Questions tracked** - All in task Q&A history  
✅ **User control** - User approves big changes  
✅ **No surprises** - User confirms completion  
✅ **Professional** - Respectful workflow

---

**ENFORCEMENT: ZERO questions in chat. ALL via `mcp_extension-auxly_auxly_ask_question`. ALWAYS ask before marking done/review/cancelled.**
