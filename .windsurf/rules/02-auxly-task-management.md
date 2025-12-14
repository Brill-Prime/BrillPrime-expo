---
trigger: always_on
description: 02 auxly task management
---

---
description: Auxly Rule #2 - Check existing tasks before creating new ones and read tasks carefully before starting
alwaysApply: true
priority: 1
---

# 🔒 AUXLY RULE #2: TASK MANAGEMENT

**MANDATORY: Check for duplicates before creating tasks, read tasks carefully before starting**

---

## PART A: CHECK TASKS BEFORE CREATING

### ✅ REQUIRED STEPS:

```typescript
// STEP 1: Check TODO tasks
const todoTasks = await mcp_extension-auxly_auxly_list_tasks({ 
  status: "todo" 
});

// STEP 2: Check IN_PROGRESS tasks
const inProgressTasks = await mcp_extension-auxly_auxly_list_tasks({ 
  status: "in_progress" 
});

// STEP 3: Read all task titles - check for duplicates

// STEP 4: Only create if NO duplicate found
if (!duplicateFound) {
  await mcp_extension-auxly_auxly_create_task({
    title: "New task",
    description: "Description",
    priority: "high"
  });
}
```

### ❌ FORBIDDEN:
- Creating tasks without calling `mcp_extension-auxly_auxly_list_tasks` first
- Assuming no duplicate exists
- Not reading task titles

---

## PART B: READ TASKS CAREFULLY BEFORE STARTING

### ✅ REQUIRED STEPS:

```typescript
// STEP 1: Get complete task details
const task = await mcp_extension-auxly_auxly_get_task({ taskId: "X" });

// STEP 2: Read EVERYTHING:
console.log("Title:", task.title);
console.log("Description:", task.description);
console.log("Priority:", task.priority);
console.log("Tags:", task.tags);

// STEP 3: Check existing work:
console.log("Research:", task.research);       // What's been researched
console.log("Q&A History:", task.qaHistory);   // Previous questions/answers
console.log("File Changes:", task.changes);    // Files already modified
console.log("Comments:", task.comments);       // Progress notes

// STEP 4: Understand FULL context before coding
```

### ❌ FORBIDDEN:
- Starting work without calling `mcp_extension-auxly_auxly_get_task`
- Skipping description/research/qaHistory
- Assuming requirements

---

## Complete Example:

```typescript
// User: "Continue work on Task #14"

// STEP 1: Get task
const task = await mcp_extension-auxly_auxly_get_task({ taskId: "14" });

// STEP 2: Read description, research, Q&A history, file changes

// STEP 3: Now start work with full context
await mcp_extension-auxly_auxly_update_task({
  taskId: "14",
  status: "in_progress",
  aiWorkingOn: true
});
```

---

## Why This Rule Exists:

✅ **Prevents duplicates** - Clean task list  
✅ **Avoids rework** - See what's already done  
✅ **Full context** - Understand requirements  
✅ **Professional** - Thorough approach

---

**ENFORCEMENT: ALWAYS call `mcp_extension-auxly_auxly_list_tasks` before creating, ALWAYS call `mcp_extension-auxly_auxly_get_task` before starting work.**
