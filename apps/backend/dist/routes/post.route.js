"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRoutes = postRoutes;
const authenticate_1 = require("../middleware/authenticate");
const cloudinary_1 = require("../utils/cloudinary");
const client_1 = require("@prisma/client");
const promises_1 = require("stream/promises");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const prisma = new client_1.PrismaClient();
async function postRoutes(fastify) {
    // Create a post
    fastify.post('/', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const parts = req.parts();
        let caption;
        let mediaUrl;
        let mediaType;
        for await (const part of parts) {
            if (part.type === 'field' && part.fieldname === 'caption') {
                caption = part.value;
            }
            if (part.type === 'file') {
                const ext = path_1.default.extname(part.filename).toLowerCase();
                const isVideo = ['.mp4', '.mov', '.avi'].includes(ext);
                const tmpPath = path_1.default.join(os_1.default.tmpdir(), `upload_${Date.now()}${ext}`);
                await (0, promises_1.pipeline)(part.file, (0, fs_1.createWriteStream)(tmpPath));
                if (isVideo) {
                    mediaUrl = await (0, cloudinary_1.uploadVideo)(tmpPath, 'posts');
                    mediaType = 'VIDEO';
                }
                else {
                    mediaUrl = await (0, cloudinary_1.uploadImage)(tmpPath, 'posts');
                    mediaType = 'IMAGE';
                }
                (0, fs_1.unlink)(tmpPath, () => { });
            }
        }
        if (!mediaUrl || !mediaType) {
            return reply.status(400).send({ error: 'Media file required' });
        }
        const post = await prisma.post.create({
            data: {
                authorId: req.currentUser.id,
                caption,
                mediaUrl,
                mediaType,
            },
            include: {
                author: {
                    select: { id: true, username: true, avatarUrl: true, displayName: true }
                }
            }
        });
        reply.status(201).send(post);
    });
    // Get feed — all posts newest first with pagination
    fastify.get('/feed', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { skip = '0', take = '10' } = req.query;
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            skip: parseInt(skip),
            take: parseInt(take),
            include: {
                author: {
                    select: { id: true, username: true, avatarUrl: true, displayName: true }
                }
            }
        });
        reply.send(posts);
    });
    // Get a single post
    fastify.get('/:id', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { id } = req.params;
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, username: true, avatarUrl: true, displayName: true }
                }
            }
        });
        if (!post)
            return reply.status(404).send({ error: 'Post not found' });
        reply.send(post);
    });
    // Like a post
    fastify.post('/:id/like', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { id } = req.params;
        const post = await prisma.post.update({
            where: { id },
            data: { likes: { increment: 1 } }
        });
        reply.send({ likes: post.likes });
    });
    // Delete a post (only author can delete)
    fastify.delete('/:id', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { id } = req.params;
        const userId = req.currentUser.id;
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post)
            return reply.status(404).send({ error: 'Post not found' });
        if (post.authorId !== userId) {
            return reply.status(403).send({ error: 'Not your post' });
        }
        await prisma.post.delete({ where: { id } });
        reply.status(204).send();
    });
    // Get posts by a specific user
    fastify.get('/user/:userId', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { userId } = req.params;
        const posts = await prisma.post.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { id: true, username: true, avatarUrl: true, displayName: true }
                }
            }
        });
        reply.send(posts);
    });
}
