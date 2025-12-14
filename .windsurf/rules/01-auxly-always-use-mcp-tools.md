---
trigger: always_on
description: 01 auxly always use mcp tools
---

---
description: Auxly Rule #1 - Always use Auxly MCP tools, never bypass the system
alwaysApply: true
priority: 1
---

# 🔒 AUXLY RULE #1: ALWAYS USE MCP TOOLS

**MANDATORY: Never bypass Auxly MCP tools**

---

## ✅ REQUIRED MCP TOOLS:

```typescript
// Creating tasks
mcp_extension-auxly_auxly_create_task({
  title: "Task title",
  description: "Task description",
  priority: "high",
  tags: ["tag1", "tag2"]
})

// Updating tasks
mcp_extension-auxly_auxly_update_task({
  taskId: "X",
  status: "in_progress",
  aiWorkingOn: true
})

// Getting task details
mcp_extension-auxly_auxly_get_task({ 
  taskId: "X" 
})

// Listing tasks
mcp_extension-auxly_auxly_list_tasks({ 
  status: "todo" 
})

// Asking questions
mcp_extension-auxly_auxly_ask_question({
  taskId: "X",
  questionText: "Question?",
  category: "TECHNICAL DECISION",
  priority: "high",
  context: "Context...",
  options: [...]
})

// Adding research
mcp_extension-auxly_auxly_add_research({
  taskId: "X",
  type: "technical",
  source: "Source",
  summary: "Summary",
  relevance: "Relevance"
})

// Logging file changes
mcp_extension-auxly_auxly_log_file_change({
  taskId: "X",
  filePath: "path/to/file.ts",
  changeType: "modified",
  description: "What changed",
  linesAdded: 10,
  linesDeleted: 2
})

// Adding comments
mcp_extension-auxly_auxly_add_comment({
  taskId: "X",
  type: "note",
  content: "Progress update"
})

// Deleting tasks
mcp_extension-auxly_auxly_delete_task({ 
  taskId: "X" 
})
```

---

## ❌ FORBIDDEN:

- Creating tasks manually (not via `mcp_extension-auxly_auxly_create_task`)
- Asking questions in chat (must use `mcp_extension-auxly_auxly_ask_question`)
- Modifying files without logging (must use `mcp_extension-auxly_auxly_log_file_change`)
- Skipping workflow steps

---

## Why This Rule Exists:

✅ **Complete transparency** - All work visible in task panel  
✅ **Audit trail** - Every action tracked  
✅ **User control** - User sees everything  
✅ **Professional workflow** - Proper task management

---

**ENFORCEMENT: This rule is MANDATORY. 100% compliance required. Always call tools with full `mcp_extension-auxly_auxly_` prefix.**
