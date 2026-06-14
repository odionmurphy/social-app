"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const authenticate_1 = require("../middleware/authenticate");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function userRoutes(fastify) {
    fastify.get('/me', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { id } = req.currentUser;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true, username: true, email: true,
                displayName: true, bio: true, avatarUrl: true
            }
        });
        reply.send(user);
    });
    fastify.patch('/me', { preHandler: authenticate_1.authenticate }, async (req, reply) => {
        const { id } = req.currentUser;
        const body = req.body;
        const user = await prisma.user.update({
            where: { id },
            data: { displayName: body.displayName, bio: body.bio },
            select: {
                id: true, username: true,
                displayName: true, bio: true, avatarUrl: true
            }
        });
        reply.send(user);
    });
}
