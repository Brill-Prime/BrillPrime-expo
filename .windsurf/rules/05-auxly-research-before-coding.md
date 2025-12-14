---
trigger: always_on
description: 05 auxly research before coding
---

---
description: Auxly Rule #5 - Always research before writing code using mcp_extension-auxly_auxly_add_research
alwaysApply: true
priority: 1
---

# 🔒 AUXLY RULE #5: RESEARCH BEFORE CODING

**MANDATORY: Research FIRST using `mcp_extension-auxly_auxly_add_research`, code SECOND**

---

## ✅ REQUIRED RESEARCH STEPS:

```typescript
// STEP 1: Search local codebase
// Use: codebase_search, grep, read_file

// STEP 2: Document local findings
await mcp_extension-auxly_auxly_add_research({
  taskId: "X",
  type: "technical",
  source: "Local: extension/src/config/local-config.ts",
  summary: "Existing LocalConfigService uses singleton pattern with getTrialInfoHybrid() for trial tracking.",
  relevance: "Can extend this service for new trial sync functionality."
});

// STEP 3: Search internet for best practices (if needed)
// Use: web_search tool

// STEP 4: Document external findings
await mcp_extension-auxly_auxly_add_research({
  taskId: "X",
  type: "technical",
  source: "https://code.visualstudio.com/api/extension-guides/webview",
  summary: "VS Code webview CSP requires 'data:' in img-src directive for base64 images.",
  relevance: "Need to update CSP in TaskPanelProvider to display embedded logo images."
});

// NOW ready to code
```

---

## 📋 RESEARCH CHECKLIST:

Before coding, verify:
- ✅ Searched for existing similar code
- ✅ Checked current implementation patterns
- ✅ Called `mcp_extension-auxly_auxly_add_research` for local findings
- ✅ Searched for 2025 best practices (if needed)
- ✅ Called `mcp_extension-auxly_auxly_add_research` for external findings

---

## ❌ FORBIDDEN:

- Writing code without calling `mcp_extension-auxly_auxly_add_research`
- Assuming existing patterns
- Not documenting findings
- Skipping research phase

---

## Complete Research Flow:

```typescript
// User: "Add trial badge to header"

// STEP 1: Research existing header
const headerCode = await read_file("extension/src/webview/TaskPanelProvider.ts");

// STEP 2: Research trial tracking
const trialCode = await grep("getTrialInfo", "extension/");

// STEP 3: Document research
await mcp_extension-auxly_auxly_add_research({
  taskId: "4",
  type: "technical",
  source: "Local: extension/src/webview/TaskPanelProvider.ts line 2876",
  summary: "Header rendered in getHTML() method. Current header shows 'Auxly - AI Task Management' title.",
  relevance: "Can add trial badge next to MCP indicator in header section."
});

await mcp_extension-auxly_auxly_add_research({
  taskId: "4",
  type: "technical",
  source: "Local: extension/src/config/local-config.ts",
  summary: "LocalConfigService.getTrialInfoHybrid() returns trial data with status, daysRemaining.",
  relevance: "Can use this method to display trial countdown in badge."
});

// NOW start coding with full context
```

---

## Why This Rule Exists:

✅ **Better code** - Follow existing patterns  
✅ **Consistency** - Match codebase style  
✅ **Best practices** - Use modern approaches  
✅ **Professional** - Thorough preparation

---

**ENFORCEMENT: NO coding without calling `mcp_extension-auxly_auxly_add_research`. Research FIRST, code SECOND. ALWAYS.**
