"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendRoutes = friendRoutes;
const authenticate_1 = require("../middleware/authenticate");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function friendRoutes(fastify) {
    // Send a friend request
    fastify.post('/request/:userId', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { userId } = req.params;
        const requesterId = req.currentUser.id;
        if (userId === requesterId) {
            return reply.status(400).send({ error: 'You cannot add yourself' });
        }
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId: userId },
                    { requesterId: userId, addresseeId: requesterId },
                ]
            }
        });
        if (existing) {
            return reply.status(409).send({ error: 'Friend request already exists', status: existing.status });
        }
        const friendship = await prisma.friendship.create({
            data: { requesterId, addresseeId: userId },
            include: {
                addressee: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true }
                }
            }
        });
        reply.status(201).send(friendship);
    });
    // Accept a friend request
    fastify.patch('/accept/:requesterId', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { requesterId } = req.params;
        const addresseeId = req.currentUser.id;
        const friendship = await prisma.friendship.updateMany({
            where: { requesterId, addresseeId, status: 'PENDING' },
            data: { status: 'ACCEPTED' }
        });
        if (friendship.count === 0) {
            return reply.status(404).send({ error: 'Friend request not found' });
        }
        reply.send({ message: 'Friend request accepted' });
    });
    // Decline a friend request
    fastify.delete('/decline/:requesterId', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { requesterId } = req.params;
        const addresseeId = req.currentUser.id;
        await prisma.friendship.deleteMany({
            where: { requesterId, addresseeId, status: 'PENDING' }
        });
        reply.status(204).send();
    });
    // Unfriend / delete friendship
    fastify.delete('/:userId', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { userId } = req.params;
        const currentUserId = req.currentUser.id;
        await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { requesterId: currentUserId, addresseeId: userId },
                    { requesterId: userId, addresseeId: currentUserId },
                ]
            }
        });
        reply.status(204).send();
    });
    // Get my friends list
    fastify.get('/list', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const currentUserId = req.currentUser.id;
        const friendships = await prisma.friendship.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: currentUserId },
                    { addresseeId: currentUserId },
                ]
            },
            include: {
                requester: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true }
                },
                addressee: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true }
                }
            }
        });
        const friends = friendships.map((f) => f.requesterId === currentUserId ? f.addressee : f.requester);
        reply.send(friends);
    });
    // Get pending requests sent TO me
    fastify.get('/requests/incoming', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const currentUserId = req.currentUser.id;
        const requests = await prisma.friendship.findMany({
            where: { addresseeId: currentUserId, status: 'PENDING' },
            include: {
                requester: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true }
                }
            }
        });
        reply.send(requests);
    });
    // Get pending requests I sent
    fastify.get('/requests/outgoing', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const currentUserId = req.currentUser.id;
        const requests = await prisma.friendship.findMany({
            where: { requesterId: currentUserId, status: 'PENDING' },
            include: {
                addressee: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true }
                }
            }
        });
        reply.send(requests);
    });
    // Search users to add as friends
    fastify.get('/search', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { q } = req.query;
        const currentUserId = req.currentUser.id;
        if (!q || q.trim().length < 2) {
            return reply.status(400).send({ error: 'Search query must be at least 2 characters' });
        }
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    {
                        OR: [
                            { username: { contains: q, mode: 'insensitive' } },
                            { displayName: { contains: q, mode: 'insensitive' } },
                        ]
                    }
                ]
            },
            select: {
                id: true, username: true, displayName: true, avatarUrl: true
            },
            take: 20
        });
        // For each user, check friendship status
        const usersWithStatus = await Promise.all(users.map(async (user) => {
            const friendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { requesterId: currentUserId, addresseeId: user.id },
                        { requesterId: user.id, addresseeId: currentUserId },
                    ]
                }
            });
            return {
                ...user,
                friendshipStatus: friendship?.status ?? null,
                friendshipId: friendship?.id ?? null,
                iRequested: friendship?.requesterId === currentUserId,
            };
        }));
        reply.send(usersWithStatus);
    });
    // Get friendship status with a specific user
    fastify.get('/status/:userId', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { userId } = req.params;
        const currentUserId = req.currentUser.id;
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: currentUserId, addresseeId: userId },
                    { requesterId: userId, addresseeId: currentUserId },
                ]
            }
        });
        reply.send({
            status: friendship?.status ?? null,
            iRequested: friendship?.requesterId === currentUserId,
        });
    });
}
