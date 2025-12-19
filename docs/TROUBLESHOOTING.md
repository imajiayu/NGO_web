# Troubleshooting ProjectCard Issues

## Common Issues and Solutions

### Issue 1: "Invalid Date" displayed in Start/End Date

**Cause:** The date field is null or in an invalid format.

**Solution:**
- The code now includes null checking and error handling
- If you still see "Invalid Date", the date in your database might be in an incorrect format
- Expected format: `YYYY-MM-DD` (e.g., `2024-01-15`)

**To fix:**
```sql
-- Check your project dates
SELECT id, project_name, start_date, end_date, is_long_term FROM projects;

-- Update invalid dates (example)
UPDATE projects
SET start_date = '2024-01-01'::date
WHERE id = YOUR_PROJECT_ID;
```

### Issue 2: Long-term tag not showing

**Cause:** The `is_long_term` field is not included in the `project_stats` view, or the database migration hasn't been applied.

**Solution:**
1. **Apply the database migration:**
   ```bash
   # Method 1: Via Supabase Dashboard
   # Go to SQL Editor and run the contents of:
   # supabase/migrations/005_update_project_stats_view.sql

   # Method 2: Via Supabase CLI (if you have it set up)
   npx supabase db push
   ```

2. **Verify the migration was applied:**
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'project_stats';

   -- You should see: is_long_term | boolean
   ```

3. **Check your project data:**
   ```sql
   SELECT id, project_name, is_long_term FROM project_stats;
   ```

### Issue 3: End date not showing

**Cause:** Either:
- The `end_date` field is NULL in the database
- The `is_long_term` field is `true` (which hides the end date by design)
- The migration hasn't been applied

**Solution:**
1. **Check your data:**
   ```sql
   SELECT id, project_name, end_date, is_long_term FROM projects;
   ```

2. **Set end_date for fixed-term projects:**
   ```sql
   UPDATE projects
   SET end_date = '2024-12-31'::date,
       is_long_term = false
   WHERE id = YOUR_PROJECT_ID;
   ```

3. **For long-term projects (no end date):**
   ```sql
   UPDATE projects
   SET end_date = NULL,
       is_long_term = true
   WHERE id = YOUR_PROJECT_ID;
   ```

### Issue 4: Funding progress showing $0 / $0 instead of units

**Cause:** Old code was using monetary amounts.

**Solution:** This has been fixed in the latest code. The display now shows:
- `{current_units} / {target_units} {unit_name}`
- Example: `5 / 100 kits`

If you still see money values:
1. Clear your browser cache
2. Restart your dev server: `npm run dev`

## Verification Steps

### 1. Verify Database Migration

Run this query in Supabase SQL Editor:

```sql
-- Check that project_stats view has all necessary columns
SELECT
  id,
  project_name,
  location,
  start_date,
  end_date,
  is_long_term,
  status,
  target_units,
  current_units,
  unit_name,
  unit_price,
  total_raised,
  donation_count,
  progress_percentage,
  target_amount
FROM project_stats
LIMIT 1;
```

If any column is missing, you need to apply migration 005.

### 2. Verify Sample Project Data

Create a test project with all fields:

```sql
-- Insert a fixed-term test project
INSERT INTO projects (
  project_name,
  location,
  start_date,
  end_date,
  is_long_term,
  target_units,
  current_units,
  unit_name,
  unit_price,
  status
) VALUES (
  'Test Fixed-Term Project',
  'Test Location',
  '2024-01-01',
  '2024-12-31',
  false,
  100,
  25,
  'kit',
  10.00,
  'active'
);

-- Insert a long-term test project
INSERT INTO projects (
  project_name,
  location,
  start_date,
  end_date,
  is_long_term,
  target_units,
  current_units,
  unit_name,
  unit_price,
  status
) VALUES (
  'Test Long-Term Project',
  'Test Location',
  '2024-01-01',
  NULL,
  true,
  1000,
  150,
  'meal',
  5.00,
  'active'
);
```

### 3. Check the Frontend

After applying migrations and verifying data:

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Visit the home page: `http://localhost:3000/en`

3. You should see:
   - **For fixed-term projects:**
     - Status badge (green "Active")
     - Start date
     - End date
     - Progress bar
     - Funding progress in units (e.g., "25 / 100 kits")

   - **For long-term projects:**
     - Status badge (green "Active")
     - Long-term badge (purple "Long-term")
     - Start date
     - NO end date
     - NO progress bar
     - Funding progress in units

## Debug Mode

To add temporary debugging, you can modify `ProjectCard.tsx`:

```tsx
// Add at the top of the component function
console.log('Project data:', {
  id: project.id,
  name: project.project_name,
  is_long_term: project.is_long_term,
  start_date: project.start_date,
  end_date: project.end_date,
  status: project.status
})
```

Check your browser console to see the actual data being received.

## Still Having Issues?

1. **Clear all caches:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check TypeScript types are up to date:**
   - The file `types/database.ts` should have `is_long_term` in the `project_stats` view type

3. **Verify the query function:**
   - `lib/supabase/queries.ts` should use `getAllProjectsWithStats()` which queries `project_stats` view

4. **Check the migration was actually run:**
   ```sql
   -- This will show you all applied migrations
   SELECT * FROM supabase_migrations.schema_migrations;
   ```

If you see migration `005_update_project_stats_view` in the list, it has been applied.
