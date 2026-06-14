import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'No token provided' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { userId: string }
    // Store user id on request object using a custom property
    ;(req as any).currentUser = { id: payload.userId }
  } catch {
    return reply.status(401).send({ error: 'Token expired or invalid' })
  }
}
