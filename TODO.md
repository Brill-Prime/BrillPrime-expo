# Fix TypeScript Errors in Expo App

## Current Status

- 624 TypeScript errors in 154 files
- Major issues: missing type declarations, duplicate exports, code syntax errors

## Plan

1. **Install missing @types packages**
   - @types/react-native
   - @types/expo-router
   - @types/firebase
   - @types/expo-updates
   - @types/react (already present)

2. **Fix duplicate exports in validation.ts**
   - Remove the export block at the end causing redeclaration errors

3. **Fix useRef calls without initial values**
   - Update useSessionTimeout.ts to provide initial values for useRef

4. **Add missing type declarations**
   - Create type declarations for modules without @types packages

5. **Fix implicit any types and other code issues**
   - Add proper types to parameters and variables

6. **Run tsc again to verify fixes**

## Progress

- [ ] Install missing type packages
- [ ] Fix validation.ts duplicate exports
- [ ] Fix useRef in useSessionTimeout.ts
- [ ] Add type declarations
- [ ] Fix remaining code issues
- [ ] Verify all errors resolved
