#!/bin/bash

echo "🔧 Safely fixing ESLint issues..."

# Create backup
echo "📁 Creating backup..."
cp -r src src_backup_$(date +%Y%m%d_%H%M%S)

echo "🗑️  Fixing unused variables..."

# Fix specific unused imports - safer approach
echo "// Removed unused NextRequest import" > temp_comment.txt

# Fix NextRequest import in stats route
sed -i.bak 's/import { NextRequest }/\/\/ import { NextRequest }/' src/app/api/admin/stats/route.ts

# Comment out unused variable assignments (safer than removing)
echo "Commenting out unused variables..."

# Fix mealStage in meal-coach route
sed -i.bak 's/const mealStage = /\/\/ const mealStage = /' src/app/api/gpt/meal-coach/route.ts

# Fix unused variables in merge-user-data route  
sed -i.bak 's/const mealUpdateData = /\/\/ const mealUpdateData = /' src/app/api/merge-user-data/route.ts
sed -i.bak 's/const nameUpdateData = /\/\/ const nameUpdateData = /' src/app/api/merge-user-data/route.ts  
sed -i.bak 's/const pushUpdateData = /\/\/ const pushUpdateData = /' src/app/api/merge-user-data/route.ts

echo "✨ Creating manual fix instructions..."

cat > MANUAL_FIXES_NEEDED.md << 'EOF'
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

EOF

echo "🧹 Cleaning up..."
find src -name "*.bak" -type f -delete
rm -f temp_comment.txt

echo "✅ Safe fixes completed!"
echo ""
echo "📖 Check MANUAL_FIXES_NEEDED.md for step-by-step instructions"
echo "🔍 The automated fixes only commented out unused variables safely"
echo "💾 Your code is backed up in src_backup_* folder"
echo ""
echo "Next steps:"
echo "1. Read MANUAL_FIXES_NEEDED.md"
echo "2. Fix the issues manually using Find & Replace"
echo "3. Run 'npm run lint' to check progress"