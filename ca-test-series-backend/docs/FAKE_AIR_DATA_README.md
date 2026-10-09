# Fake AIR Data Generator

This script generates fake All India Rank (AIR) data for testing and development purposes.

## Overview

The seeding script creates:
- **Fake students** with realistic Indian names, email addresses, and locations (city/state)
- **Fake submissions** with marks distributed in a bell curve (normal distribution)
- Automatic **AIR rankings** calculated when accessing analytics endpoints

## Prerequisites

- MongoDB connection configured in `.env`
- At least one test series in the database (will create one if none exists)

## Usage

### Generate Fake Data

```bash
# Generate 100 students with 5 submissions each (default)
node scripts/seed-fake-air-data.js

# Generate custom number of students and submissions
node scripts/seed-fake-air-data.js 500 10
# This creates 500 students with 10 submissions each
```

**Parameters:**
1. Number of students (default: 100)
2. Submissions per student (default: 5)

### Clean Up Fake Data

```bash
# Remove all fake data
node scripts/cleanup-fake-data.js
```

## Features

### Realistic Data Generation

1. **Student Names**: Combination of common Indian first and last names
2. **Locations**: 20+ major Indian cities with correct state mappings
3. **CA Levels**: Random assignment of FOUNDATION, INTERMEDIATE, or FINAL
4. **Email**: Auto-generated pattern: `firstname.lastname[number]@test.com`
5. **Marks Distribution**: Bell curve centered at 55% with standard deviation of 12
   - All students score between 30-80%
   - Most students cluster around 55%
   - Realistic representation of exam results

### Score Distribution

The script uses a **normal distribution** for marks:
```
Mean: 55 marks (55%)
Standard Deviation: 12 marks
Range: 30-80 marks (30-80%)
```

This creates a realistic bell curve:
- ~68% of students score between 43-67
- ~95% of students score between 31-79
- All scores clamped to 30-80 range
- Most students cluster around the 50-60% range

### Data Identification

All fake data is tagged with:
```javascript
meta: {
  fakeData: true,
  generatedAt: Date
}
```

This makes it easy to:
- Identify fake vs real data
- Clean up selectively
- Filter in queries

## Testing AIR Rankings

After seeding, you can test the rankings:

1. **Student Analytics API**:
   ```
   GET /api/students/analytics
   ```
   Returns:
   - All India Rank
   - State Rank
   - City Rank
   - Percentile
   - Total Students
   - Overall Percentage

2. **Admin Analytics API**:
   ```
   GET /api/admin/analytics
   ```
   Returns comprehensive analytics including performance distribution

## Example Output

```
Generating fake AIR data...
Students to create: 100
Submissions per student: 5

Using test series: CA Foundation Mock Test Series (507f1f77bcf86cd799439011)

Creating fake students...
✓ Created 100 fake students

Creating fake submissions...
✓ Created 500 fake submissions

========================================
✓ Fake AIR data seeding completed!
========================================

Summary:
- Students created: 100
- Submissions created: ~500
- Test Series used: CA Foundation Mock Test Series

The AIR rankings will be automatically calculated when you access the analytics endpoint.
Student credentials: email as shown above, password: Test@12345
```

## Sample Student Login

You can log in as any generated student:
- **Email**: Check console output or database
- **Password**: `Test@12345`

## Cleanup

To remove all fake data from the database:

```bash
node scripts/cleanup-fake-data.js
```

Or manually in MongoDB:
```javascript
db.users.deleteMany({ "meta.fakeData": true })
db.submissions.deleteMany({ "meta.fakeData": true })
```

## Notes

- The script is **idempotent** for students (uses unique email)
- Submissions might fail on re-run due to unique index (studentId + testSeriesId + testId)
- All passwords are hashed by Mongoose pre-save hooks
- Evaluation dates are randomly set within the last 30 days
- All submissions are marked as "COMPLETED" status

## Troubleshooting

### "No test series found"
The script will automatically create a sample test series if none exists.

### Duplicate key errors
If you run the script multiple times, you might see duplicate key errors for submissions. This is normal and can be ignored. The script will continue and insert unique submissions.

### Connection errors
Ensure your `.env` file has the correct `MONGODB_URI` configured.

## Development Tips

1. Start with a small dataset (50-100 students) for quick testing
2. Use larger datasets (500-1000 students) for performance testing
3. Clean up regularly to avoid database bloat
4. Check the AIR calculation logic in `studentController.js`
5. Monitor database size with large datasets

## Integration with Frontend

The frontend can display the AIR data using the analytics endpoint:
- Dashboard cards showing rank badges
- Performance graphs and charts
- Leaderboard comparisons
- Progress tracking over time

## License

Internal development tool - not for production use.
