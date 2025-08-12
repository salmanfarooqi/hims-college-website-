# Vercel File Size Limit Fix

## Problem
The backend was getting "413 Content Too Large" errors when uploading hero slides because:
1. **Vercel serverless functions** have a hard limit of 4.5MB for request bodies
2. **Express app** was configured for 100MB file uploads
3. **Multer** was set to accept files up to 100MB

## Solution Applied

### 1. Updated Vercel Configuration (`vercel.json`)
- Added function configuration with increased memory and duration limits
- This helps with processing larger files within Vercel's constraints

### 2. Reduced File Size Limits
- **Multer limits**: Changed from 100MB to 4MB
- **Express limits**: Changed from 100MB to 4MB  
- **File validation**: Updated both upload endpoints to check for 4MB limit

### 3. Updated Frontend Validation
- Changed file size validation from 10MB to 2MB (for compression progress)
- Updated error messages to reflect 4MB limit
- Updated UI text to show "Max 4MB" instead of "Max 50MB"

### 4. Added Documentation
- Added comments explaining Vercel limitations
- Documented why 4MB limit is necessary

## New Limits
- **Maximum file size**: 4MB (was 100MB)
- **Compression threshold**: 2MB (was 10MB)
- **Vercel compatibility**: ✅ Yes

## Testing
1. Try uploading an image under 4MB - should work
2. Try uploading an image over 4MB - should get clear error message
3. Check that compression still works for files 2MB+

## Why 4MB?
- Vercel's hard limit is 4.5MB
- We use 4MB to provide a safety margin
- 4MB is sufficient for most web images
- Automatic compression will optimize file sizes further

## Deployment
After making these changes:
1. Commit and push to your repository
2. Vercel will automatically redeploy
3. The new 4MB limit will be active

## Fallback Options
If you need to handle larger files in the future:
1. **Direct Cloudinary upload** from frontend (bypasses Vercel)
2. **Chunked uploads** (split large files)
3. **External upload service** (AWS S3, etc.)

## Files Modified
- `vercel.json` - Added function configuration
- `server.js` - Reduced Express limits to 4MB
- `routes/content.js` - Reduced Multer limits to 4MB
- `app/admin/hero-slides/page.tsx` - Updated frontend validation 