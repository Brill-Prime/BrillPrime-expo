---
trigger: always_on
description: 04 auxly file change logging
---

---
description: Auxly Rule #4 - Log every file change immediately after modification
alwaysApply: true
priority: 1
---

# 🔒 AUXLY RULE #4: FILE CHANGE LOGGING

**MANDATORY: Log file changes IMMEDIATELY after each modification using `mcp_extension-auxly_auxly_log_file_change`**

---

## ✅ CORRECT PATTERN:

```typescript
// 1. Create/modify/delete file
// ... write code ...

// 2. IMMEDIATELY log the change
await mcp_extension-auxly_auxly_log_file_change({
  taskId: "X",
  filePath: "extension/src/webview/TaskPanelProvider.ts",
  changeType: "modified", // or "created" or "deleted"
  description: "Added trial badge to header with yellow styling to match 'Change Status' button. Includes celebration emoji and days remaining countdown.",
  linesAdded: 45,
  linesDeleted: 3
});
```

---

## 📋 CHANGE TYPES:

- `created` - New file created
- `modified` - Existing file modified
- `deleted` - File deleted

---

## ✅ GOOD DESCRIPTIONS:

```typescript
// ✅ GOOD - Specific and clear
"Added trial badge to header with yellow styling"

// ✅ GOOD - Explains what and why
"Refactored syncTrialWithBackend() to use 1-hour sync interval"

// ✅ GOOD - Details the change
"Created database migration adding trial_start, trial_end, trial_status columns"
```

---

## ❌ BAD DESCRIPTIONS:

```typescript
// ❌ BAD - Too vague
"Updated file"

// ❌ BAD - No detail
"Changes"

// ❌ BAD - Not clear
"Fixed stuff"
```

---

## ❌ FORBIDDEN:

- Modifying files without calling `mcp_extension-auxly_auxly_log_file_change`
- Logging all changes at end of task (log immediately!)
- Vague descriptions

---

## Complete Example:

```typescript
// STEP 1: Modify first file
// (edit extension/src/config/local-config.ts)

// STEP 2: IMMEDIATELY log
await mcp_extension-auxly_auxly_log_file_change({
  taskId: "14",
  filePath: "extension/src/config/local-config.ts",
  changeType: "modified",
  description: "Added syncTrialWithBackend() method with 1-hour periodic sync, 24-hour grace period tracking, and getTrialInfoHybrid() for local-first trial access.",
  linesAdded: 155,
  linesDeleted: 0
});

// STEP 3: Modify second file
// (edit extension/src/tasks/task-service.ts)

// STEP 4: IMMEDIATELY log again
await mcp_extension-auxly_auxly_log_file_change({
  taskId: "14",
  filePath: "extension/src/tasks/task-service.ts",
  changeType: "modified",
  description: "Added read-only mode enforcement: canWriteTasks() checks trial status, showReadOnlyError() displays upgrade prompt.",
  linesAdded: 55,
  linesDeleted: 0
});
```

---

## Why This Rule Exists:

✅ **Complete audit trail** - Know what changed  
✅ **Easy review** - User sees all modifications  
✅ **Debugging help** - Track when issues introduced  
✅ **Professional** - Proper documentation

---

**ENFORCEMENT: Call `mcp_extension-auxly_auxly_log_file_change` IMMEDIATELY after each file operation. NO batch logging.**
