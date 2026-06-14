"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const RegisterSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(72),
    displayName: zod_1.z.string().min(1).max(50),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
async function authRoutes(fastify) {
    fastify.post('/register', async (request, reply) => {
        const body = RegisterSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ error: body.error.flatten() });
        }
        try {
            const result = await (0, auth_service_1.registerUser)(body.data);
            reply.status(201).send(result);
        }
        catch (err) {
            reply.status(409).send({ error: err.message });
        }
    });
    fastify.post('/login', async (request, reply) => {
        const body = LoginSchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ error: body.error.flatten() });
        }
        try {
            const result = await (0, auth_service_1.loginUser)(body.data);
            reply.send(result);
        }
        catch (err) {
            reply.status(401).send({ error: err.message });
        }
    });
}
