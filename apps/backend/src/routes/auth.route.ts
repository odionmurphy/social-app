import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { registerUser, loginUser } from '../services/auth.service'

const RegisterSchema = z.object({
  username:    z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email:       z.string().email(),
  password:    z.string().min(8).max(72),
  displayName: z.string().min(1).max(50),
})

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export async function authRoutes(fastify: FastifyInstance) {

  fastify.post('/register', async (request, reply) => {
    const body = RegisterSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() })
    }
    try {
      const result = await registerUser(body.data)
      reply.status(201).send(result)
    } catch (err: any) {
      reply.status(409).send({ error: err.message })
    }
  })

  fastify.post('/login', async (request, reply) => {
    const body = LoginSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() })
    }
    try {
      const result = await loginUser(body.data)
      reply.send(result)
    } catch (err: any) {
      reply.status(401).send({ error: err.message })
    }
  })
}
