import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function userRoutes(fastify: FastifyInstance) {

  fastify.get('/me', { preHandler: authenticate }, async (req, reply) => {
    const { id } = (req as any).currentUser
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, email: true,
        displayName: true, bio: true, avatarUrl: true
      }
    })
    reply.send(user)
  })

  fastify.patch('/me', { preHandler: authenticate }, async (req, reply) => {
    const { id } = (req as any).currentUser
    const body = req.body as { displayName?: string; bio?: string }
    const user = await prisma.user.update({
      where: { id },
      data:  { displayName: body.displayName, bio: body.bio },
      select: {
        id: true, username: true,
        displayName: true, bio: true, avatarUrl: true
      }
    })
    reply.send(user)
  })
}
