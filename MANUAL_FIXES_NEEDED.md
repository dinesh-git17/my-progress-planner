# Manual ESLint Fixes Needed

## 1. Fix React Unescaped Entities
Replace these characters in JSX text (between > and <):

**Single quotes/apostrophes:**
- `Don't` → `Don&apos;t`
- `can't` → `can&apos;t` 
- `won't` → `won&apos;t`
- `it's` → `it&apos;s`
- `I'm` → `I&apos;m`
- `you're` → `you&apos;re`
- `we're` → `we&apos;re`
- `let's` → `let&apos;s`

**Double quotes:**
- `"word"` → `&quot;word&quot;`

## 2. Fix Unused Variables (search and remove/comment these lines)

**In src/app/admin/page.tsx around line 454:**
- Remove unused `index` parameter from .map()
- Change: `.map((item, index) =>` 
- To: `.map((item) =>`

**In src/app/page.tsx:**
- Remove unused `err` in catch blocks: `} catch (err) {` → `} catch {`
- Remove unused `event` parameters: `(event) => {` → `() => {`

**In src/app/streaks/page.tsx:**
- Remove unused `err` in catch blocks: `} catch (err) {` → `} catch {`

**In src/app/summaries/page.tsx:**
- Remove unused `inter` variable (comment out the import)
- Remove unused `summary` parameter from .map()

## 3. Fix React Hook Dependencies

**In src/app/page.tsx, find these useEffect hooks and add missing dependencies:**

```javascript
// Around line 544
useEffect(() => {
  // existing code
}, [fetchLoggedMeals, fetchQuote]); // Add these dependencies

// Around line 586  
useEffect(() => {
  // existing code
}, [fetchLoggedMeals]); // Add this dependency

// Around line 663
useEffect(() => {
  // existing code
}, [fetchLoggedMeals, fetchQuote]); // Add these dependencies

// Around line 696
useEffect(() => {
  // existing code  
}, [fetchLoggedMeals, fetchQuote]); // Add these dependencies
```

## 4. Optional: Disable Console Warnings

If you want to keep console.log statements during development, update .eslintrc.json:

```json
{
  "rules": {
    "no-console": "off"  // This will remove all console warnings
  }
}
```

## Quick Search & Replace Tips

Use VS Code's Find & Replace (Ctrl/Cmd + H) with these patterns:

**Find:** `Don't`  
**Replace:** `Don&apos;t`

**Find:** `} catch (err) {`  
**Replace:** `} catch {`

**Find:** `.map((.*), index)`  
**Replace:** `.map($1)` (enable regex mode)

