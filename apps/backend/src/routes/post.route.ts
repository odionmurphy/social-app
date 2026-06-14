import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'
import { uploadImage, uploadVideo } from '../utils/cloudinary'
import { PrismaClient } from '@prisma/client'
import { pipeline } from 'stream/promises'
import { createWriteStream, unlink } from 'fs'
import path from 'path'
import os from 'os'

const prisma = new PrismaClient()

export async function postRoutes(fastify: FastifyInstance) {

  // Create a post
  fastify.post('/', { preHandler: authenticate }, async (req, reply) => {
    const parts = req.parts()
    let caption: string | undefined
    let mediaUrl: string | undefined
    let mediaType: 'IMAGE' | 'VIDEO' | undefined

    for await (const part of parts) {
      if (part.type === 'field' && part.fieldname === 'caption') {
        caption = part.value as string
      }
      if (part.type === 'file') {
        const ext = path.extname(part.filename).toLowerCase()
        const isVideo = ['.mp4', '.mov', '.avi'].includes(ext)
        const tmpPath = path.join(os.tmpdir(), `upload_${Date.now()}${ext}`)
        await pipeline(part.file, createWriteStream(tmpPath))

        if (isVideo) {
          mediaUrl  = await uploadVideo(tmpPath, 'posts')
          mediaType = 'VIDEO'
        } else {
          mediaUrl  = await uploadImage(tmpPath, 'posts')
          mediaType = 'IMAGE'
        }
        unlink(tmpPath, () => {})
      }
    }

    if (!mediaUrl || !mediaType) {
      return reply.status(400).send({ error: 'Media file required' })
    }

    const post = await prisma.post.create({
      data: {
        authorId:  (req as any).currentUser.id,
        caption,
        mediaUrl,
        mediaType,
      },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, displayName: true }
        }
      }
    })
    reply.status(201).send(post)
  })

  // Get feed — all posts newest first with pagination
  fastify.get('/feed', { preHandler: authenticate }, async (req, reply) => {
    const { skip = '0', take = '10' } = req.query as { skip?: string; take?: string }
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      skip:    parseInt(skip),
      take:    parseInt(take),
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, displayName: true }
        }
      }
    })
    reply.send(posts)
  })

  // Get a single post
  fastify.get('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, displayName: true }
        }
      }
    })
    if (!post) return reply.status(404).send({ error: 'Post not found' })
    reply.send(post)
  })

  // Like a post
  fastify.post('/:id/like', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const post = await prisma.post.update({
      where: { id },
      data:  { likes: { increment: 1 } }
    })
    reply.send({ likes: post.likes })
  })

  // Delete a post (only author can delete)
  fastify.delete('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).currentUser.id
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return reply.status(404).send({ error: 'Post not found' })
    if (post.authorId !== userId) {
      return reply.status(403).send({ error: 'Not your post' })
    }
    await prisma.post.delete({ where: { id } })
    reply.status(204).send()
  })

  // Get posts by a specific user
  fastify.get('/user/:userId', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.params as { userId: string }
    const posts = await prisma.post.findMany({
      where:   { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, displayName: true }
        }
      }
    })
    reply.send(posts)
  })
}
