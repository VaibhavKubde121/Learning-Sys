# KavyaLearn AI Coding Agent Instructions

## Architecture Overview

**KavyaLearn** is a full-stack educational platform with role-based access control supporting multiple user types (student, parent, instructor, admin, sub-admin).

### Stack
- **Backend**: Node.js/Express, MongoDB, Mongoose ORM
- **Frontend**: React 19 + Vite, Bootstrap 5, Tailwind CSS, Recharts
- **Dev**: Nodemon (backend), Vite dev server (frontend with `/api` proxy)

### Key Component Map
- **Routes**: `backend/routes/` — 18+ route files, one per feature domain
- **Controllers**: `backend/controllers/` — Business logic handlers
- **Models**: `backend/models/` — 16 Mongoose schemas (User, Course, Enrollment, etc.)
- **Middleware**: `backend/middleware/` — Auth, permissions, rate limiting, validation
- **Frontend API**: `frontend/src/api/axiosClient.js` — Centralized axios instance with JWT interceptor

## Critical Data Flow Patterns

### Authentication & Authorization
1. **JWT Token**: Generated in `authController.js` with payload `{id, role}` for 30 days
2. **Auth Middleware** (`authMiddleware.js`): Extracts token, verifies, populates `req.user` with full User doc
3. **Role Authorization**: Use `authorize(...roles)` middleware from `authorizeMiddleware.js` on protected routes
4. **Sub-Admin Permissions**: Check `requirePermission(permission)` in `permissionMiddleware.js` for granular feature gates

**Frontend**: Token stored in `localStorage`, attached via axios interceptor in every request

### Enrollment Workflow (Complex)
1. `createEnrollment()` → Creates pending enrollment, calculates price, returns payment intent
2. `activateEnrollment()` → Verifies payment via `paymentId`, activates course access
3. Progress tracked in User model's nested `enrolledCourses` subdocument (lessons, hours, completion %)
4. Certificate generation on 100% completion via `/api/progress/certificate` (streams PDF)

See: [enrollmentRoutes.js](backend/routes/enrollmentRoutes.js), [enrollmentController.js](backend/controllers/enrollmentController.js)

## Project-Specific Conventions

### Error Handling & Async
- **Async Controllers**: Use `express-async-handler` wrapper (e.g., `achievementController.js`)
- **Error Response**: Always include `{ message: "..." }` JSON; stack trace only in dev mode
- **Validation**: Use `express-validator` middleware chains; see [validationMiddleware.js](backend/middleware/validationMiddleware.js)

### Logging & Observables
- **Activity Logs**: Use `logActivity()` helper from `utils/activityLogger.js` for audit trails (not breaking)
- **Console Logs**: Auth-related operations log token/role details; safe for debugging but strip for production
- **Morgan Logger**: HTTP request logging enabled on server startup

### File Uploads & Media
- **Multer**: Memory storage with 5MB limit for images only; configured in [multer.js](backend/middleware/multer.js)
- **Cloudinary**: Photo upload uses `uploadToCloudinary()` from `config/cloudinary.js`
- **Frontend Validation**: File type & size checks before upload (5MB max, images only)

### Rate Limiting
- **Login**: 5 attempts per 15 min
- **General API**: 100 req per 15 min
- **AI Chat**: 10 req per minute

See: [rateLimitMiddleware.js](backend/middleware/rateLimitMiddleware.js)

## Environment Setup & Development

### Backend
```bash
npm install          # Install deps (includes OpenAI, Sendgrid, Cloudinary)
npm run dev          # Start with nodemon (watches all files)
npm run seed         # Populate demo data
npm run test-enroll  # End-to-end enrollment test
```

### Frontend
```bash
npm run dev          # Vite dev server (localhost:5173, proxies /api to :5000)
npm run build        # Vite production build
npm run lint         # ESLint check
```

### Key Env Vars (backend/.env)
- `MONGO_URI` — MongoDB connection
- `JWT_SECRET` — Token signing secret
- `OPENAI_API_KEY` — AI tutor integration
- `SENDGRID_API_KEY` — Email service
- `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` — Image CDN
- `FRONTEND_URL` (or `FRONTEND_URLS` comma-separated) — CORS whitelist

### Testing & Smoke Tests
- **smokeTest.js**: End-to-end flow (register → login → create course → enroll)
- **apiSmoke.js**: Quick AI endpoint checks (verify-upi, process-payment, chat)
- Run: `node smokeTest.js` or `node apiSmoke.js`

## Integration Points

### AI Tutor (`aiTutorRoutes.js`)
- OpenAI fallback; supports Claude if `CLAUDE_HAIKU_ENABLED=true` and `CLAUDE_API_KEY` set
- Endpoints: `POST /api/ai/chat`, `/api/ai/verify-upi`, `/api/ai/process-payment`

### Notifications & Events
- Event creation triggers instructor assignments
- Notifications model used for system alerts; Sendgrid for emails
- Schedule model for recurring events

### Courses & Lessons
- Lesson completion tracked in User's `enrolledCourses.completedLessons` array
- Progress controller manages certificate generation and PDF streaming

## Common Pitfalls & Patterns

1. **CORS Configuration**: Multiple frontend origins supported; see `corsOptions` in [server.js](backend/server.js) for whitelist logic
2. **Role Default**: If token lacks role, defaults to 'student' in auth middleware
3. **Validation Errors**: Returned as array; frontend must handle `errors: [{field, msg}]`
4. **Activity Logging Never Breaks**: Wrapped in try-catch; safe to add logging anywhere
5. **Feature Flags**: Check `featureFlagController.js` for runtime toggles (e.g., payment gateway)

## Frontend Patterns

- **Axios Client**: Centralized instance in [axiosClient.js](frontend/src/api/axiosClient.js); all API calls go through it
- **Dynamic Imports**: API functions imported dynamically in components (see Profile.jsx)
- **Token Management**: Stored in `localStorage`; interceptor automatically attaches to every request
- **Error Handling**: Components check `error.response?.data?.message` for backend errors

## API Endpoint Reference

### Core Auth
- `POST /api/auth/register` — Create user (public)
- `POST /api/auth/login` — Issue JWT token (public)
- `GET /api/auth/profile` — User profile (protected)
- `PUT /api/auth/profile` — Update profile (protected)

### Courses & Lessons
- `GET /api/courses` — List all courses
- `POST /api/instructor/courses` — Create course (instructor/admin)
- `PUT /api/instructor/courses/:id` — Update course (owner/admin)
- `DELETE /api/instructor/courses/:id` — Delete course (owner/admin)
- `GET /api/lessons` — Get lessons for course
- `POST /api/lessons` — Create lesson (instructor/admin)

### Enrollment & Payments
- `POST /api/enrollments/create` — Create pending enrollment (student, protected)
- `POST /api/enrollments/activate/:id` — Activate after payment (protected)
- `GET /api/enrollments` — List user's enrollments (protected)
- `POST /api/payments` — Record payment (student, protected)
- `GET /api/payments/instructor/revenue` — Revenue report (instructor, protected)

### Progress & Certificates
- `POST /api/student/courses/:courseId/lessons/:lessonId/complete` — Mark lesson done (student)
- `GET /api/progress/overview` — Summary of all enrollments (protected)
- `GET /api/progress/certificates/:courseId/download` — Download certificate PDF (protected)

### Admin Management
- `GET /api/admin/users` — List all users (admin)
- `POST /api/admin/users` — Create user (admin)
- `GET /api/admin/courses` — List courses (admin)
- `POST /api/admin/announcements` — Create announcement (admin)
- `GET /api/admin/dashboard/summary` — Dashboard stats (admin)

### AI & Events
- `POST /api/ai/chat` — Chat with AI tutor (openai or claude)
- `POST /api/ai/verify-upi` — Validate UPI ID (mock)
- `POST /api/ai/process-payment` — Mock payment (mock)
- `POST /api/events` — Create event (instructor/admin)
- `GET /api/events` — List events

### Other
- `GET /api/schedule/upcoming` — Upcoming classes for user
- `GET /api/notifications` — User's notifications (protected)
- `PATCH /api/notifications/:id/read` — Mark notification read (protected)

## Database Schema & Indexing

**High-traffic fields that should have indexes** (for query optimization):
```javascript
// User
user.email (unique)
user.role

// Course
course.instructor
course.enrolledStudents

// Enrollment (nested in User)
user.enrolledCourses[].course (lookups by course)

// Payment
payment.user
payment.course
payment.status

// ActivityLog
activityLog.performedBy
activityLog.targetType
```

**Key Relationships**:
- User ↔ Course (via Course.instructor, Course.enrolledStudents)
- User → enrolled courses (nested subdocument: User.enrolledCourses[])
- Course → Lessons (Course.lessons array of refs)
- Lesson → Quiz (one-to-many in Quiz model)
- User → Payment (Payment.user ref)
- Event → Instructor (Event.instructor ref)

## Payment Integration Guide

### Current Implementation
- `paymentController.js` creates Payment records with `{user, course, amount, paymentMethod, transactionId, status}`
- Enrollment workflow: `createEnrollment()` → pending payment → `activateEnrollment()` (after payment)
- Mock payment endpoints in `aiTutorRoutes.js` for UI testing

### Integrating Real Payment Gateway (Stripe/PayPal)

1. **Backend Setup** — Store gateway credentials in env vars (`STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID`, etc.)
2. **Create Payment Intent** — In `enrollmentController.createEnrollment()`:
   ```javascript
   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
   const intent = await stripe.paymentIntents.create({
     amount: course.price * 100, // cents
     currency: 'usd',
     metadata: { enrollmentId }
   });
   res.json({ clientSecret: intent.client_secret, enrollmentId });
   ```
3. **Webhook Handler** — Create `POST /api/webhooks/payment` to confirm payment:
   ```javascript
   // Stripe sends webhook with verified signature
   // On success, call enrollmentController.activateEnrollment()
   ```
4. **Frontend Flow** — Use Stripe.js or PayPal SDK to collect payment, send clientSecret confirmation
5. **Payment Record** — `activateEnrollment()` creates final Payment doc with `transactionId` from gateway

**See**: [paymentController.js](backend/controllers/paymentController.js), [enrollmentController.js](backend/controllers/enrollmentController.js)

## Testing Strategy

### Unit Testing
- Use `express-async-handler` to avoid try-catch boilerplate; easier to test isolated logic
- Controllers should be thin; business logic goes in models or separate service files
- Test validation middleware by passing invalid payloads; expect `{ message, errors: [] }` response

### Integration Testing (Recommended Pattern)
Follow the pattern in `__tests__/admin.test.js`:
1. Create test user with axios instance
2. Extract token from registration/login response
3. Make subsequent requests with `Authorization: Bearer token` header
4. Assert status codes and response shape

Example:
```javascript
const res = await api.post('/api/courses', courseData, { headers: adminHeaders });
expect(res.status).toBe(201);
expect(res.data._id).toBeDefined();
```

### End-to-End Smoke Tests
- `node smokeTest.js` — Full auth + course creation + enrollment flow
- `node apiSmoke.js` — Quick checks for AI endpoints (verify-upi, process-payment, chat)
- Run before deployment to verify critical paths

### Test Running
```bash
npm test                    # Runs jest if installed, or uses test runner
node __tests__/admin.test.js  # Run specific integration test
node smokeTest.js           # Full e2e flow
```

## Deployment

### Prerequisites
- Node.js 18+ (for global fetch in smoke tests)
- MongoDB (local or Atlas URI in `MONGO_URI`)
- npm or yarn

### Production Checklist
- [ ] Set `NODE_ENV=production` to hide stack traces
- [ ] Configure `FRONTEND_URL` (or `FRONTEND_URLS`) for CORS
- [ ] Set all API keys: `SENDGRID_API_KEY`, `OPENAI_API_KEY`, Cloudinary, Stripe, etc.
- [ ] Use strong `JWT_SECRET` (minimum 32 chars, random)
- [ ] Enable HTTPS for prod frontend; adjust CORS origins
- [ ] Set rate limits conservatively (reduce if under DDoS)
- [ ] Run `npm run seed` only in dev; skip in production

### Traditional VPS / Self-Hosted
```bash
# On server
git clone <repo>
cd backend
npm install
cp .env.example .env     # Fill in all secrets
npm run dev             # Use PM2 for production: pm2 start server.js

cd ../frontend
npm install
npm run build
# Serve dist/ via nginx or similar
```

### Docker (If Using)
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

Run: `docker run -e MONGO_URI=... -e JWT_SECRET=... -p 5000:5000 kavyalearn-backend`

### Verification After Deployment
```bash
# Check server is up
curl https://api.yourdomain.com/

# Run smoke test against production (use prod token if needed)
BASE=https://api.yourdomain.com node smokeTest.js
```

## Adding New Features

1. **Create Model** in `backend/models/`
2. **Create Controller** in `backend/controllers/` (use `asyncHandler` for async methods)
3. **Create Routes** in `backend/routes/`, apply `protect` + `authorize(roles)` as needed
4. **Add Validation** in [validationMiddleware.js](backend/middleware/validationMiddleware.js) if needed
5. **Register Routes** in [server.js](backend/server.js) under `app.use('/api/...', routeFile)`
6. **Add Activity Logging** via `logActivity()` for audit trails
7. **Update Tests** — Add test in `__tests__/` or extend `smokeTest.js`
8. **Document Endpoint** in this file's API Reference section
