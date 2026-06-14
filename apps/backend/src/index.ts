import * as dotenv from 'dotenv'
dotenv.config()

import Fastify from 'fastify'
import cors from '@fastify/cors'
import fjwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { PrismaClient } from '@prisma/client'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { authRoutes }   from './routes/auth.route'
import { userRoutes }   from './routes/user.route'
import { postRoutes }   from './routes/post.route'
import { friendRoutes } from './routes/friend.route'

const prisma = new PrismaClient()
const fastify = Fastify({ logger: true })
const httpServer = createServer(fastify.server)

export const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

declare module 'fastify' {
  interface FastifyInstance { prisma: PrismaClient }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string }
    user:    { id: string }
  }
}

async function start() {
  await fastify.register(cors, { origin: true })
  await fastify.register(fjwt, { secret: process.env.JWT_SECRET! })
  await fastify.register(multipart, {
    limits: { fileSize: 100 * 1024 * 1024 }
  })

  fastify.decorate('prisma', prisma)

  fastify.get('/health', async () => ({ status: 'ok' }))

  fastify.register(authRoutes,   { prefix: '/api/auth' })
  fastify.register(userRoutes,   { prefix: '/api/users' })
  fastify.register(postRoutes,   { prefix: '/api/posts' })
  fastify.register(friendRoutes, { prefix: '/api/friends' })

  const port = Number(process.env.PORT) || 3000
  await fastify.listen({ port, host: '0.0.0.0' })
  console.log(`Server running on http://localhost:${port}`)
}

start().catch(err => {
  fastify.log.error(err)
  process.exit(1)
})
