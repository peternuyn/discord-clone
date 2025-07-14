# Registration Test Guide

## 🧪 Testing the Registration Flow

### Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:3000`

### Test Steps

1. **Open the registration page**
   ```
   http://localhost:3000/register
   ```

2. **Test form validation**
   - Try submitting with empty fields
   - Try submitting with mismatched passwords
   - Try submitting with short password (< 8 characters)
   - Try submitting with invalid username (special characters)
   - Try submitting with invalid email format

3. **Test successful registration**
   - Fill out all fields correctly:
     - Username: `testuser123`
     - Email: `testuser123@example.com`
     - Password: `password123`
     - Confirm Password: `password123`
   - Check "I agree to Terms" checkbox
   - Click "Create Account"

4. **Verify automatic login**
   - Should be redirected to `/dashboard`
   - User should be logged in automatically
   - Check that user data is displayed correctly

### Expected Results

✅ **Form Validation**
- Error messages appear for invalid inputs
- Form doesn't submit with validation errors

✅ **Successful Registration**
- User account is created in database
- JWT token is set in HTTP-only cookie
- User is redirected to dashboard
- User is automatically logged in

✅ **Error Handling**
- Backend errors are displayed to user
- Network errors are handled gracefully

### Test Credentials

**New User Registration:**
- Username: `testuser123`
- Email: `testuser123@example.com`
- Password: `password123`

**Existing User (for login test):**
- Email: `test@example.com`
- Password: `password123`

### Backend API Test

Test the registration API directly:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apitest",
    "email": "apitest@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

Expected response:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "username": "apitest",
    "email": "apitest@example.com",
    "discriminator": "1234",
    "avatar": "...",
    "status": "offline",
    "createdAt": "..."
  }
}
```

### Troubleshooting

**If registration fails:**
1. Check backend server is running
2. Check database connection
3. Check CORS configuration
4. Check browser console for errors

**If frontend doesn't connect:**
1. Verify API URL in `.env.local`
2. Check network tab for failed requests
3. Ensure both servers are running 