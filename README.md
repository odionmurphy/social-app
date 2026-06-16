# Social App 📱

A fullstack social media mobile app with real-time chat, stories, posts, and friend connections.

## Tech Stack

**Mobile** (apps/mobile)
- React Native + Expo
- React Navigation

**Backend** (apps/backend)
- Fastify (Node.js framework)
- Prisma (database ORM)
- PostgreSQL
- Socket.io (real-time features)
- JWT (authentication)

**Monorepo**
- pnpm + Turborepo

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/users` | Get users |
| GET/POST | `/api/posts` | Feed posts |
| GET/POST | `/api/friends` | Friend requests |
| GET | `/health` | Health check |

## Screens
- Feed, Create Post
- Stories, Create Story, Story Viewer
- Friends
- Chat List
- Profile
- Login / Register

## Run Locally

Requirements: Node.js, pnpm, PostgreSQL

```bash
pnpm install
```

Create `apps/backend/.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/socialapp
JWT_SECRET=your_secret_here
PORT=3000
```

```bash
# Run database migrations
cd apps/backend
npx prisma migrate dev

# Start backend
pnpm dev

# Start mobile
cd apps/mobile
npx expo start
```

Scan the QR code with Expo Go on your phone.
