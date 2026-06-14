"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const client_1 = require("@prisma/client");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const auth_route_1 = require("./routes/auth.route");
const user_route_1 = require("./routes/user.route");
const post_route_1 = require("./routes/post.route");
const friend_route_1 = require("./routes/friend.route");
const prisma = new client_1.PrismaClient();
const fastify = (0, fastify_1.default)({ logger: true });
const httpServer = (0, http_1.createServer)(fastify.server);
exports.io = new socket_io_1.Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
async function start() {
    await fastify.register(cors_1.default, { origin: true });
    await fastify.register(jwt_1.default, { secret: process.env.JWT_SECRET });
    await fastify.register(multipart_1.default, {
        limits: { fileSize: 100 * 1024 * 1024 }
    });
    fastify.decorate('prisma', prisma);
    fastify.get('/health', async () => ({ status: 'ok' }));
    fastify.register(auth_route_1.authRoutes, { prefix: '/api/auth' });
    fastify.register(user_route_1.userRoutes, { prefix: '/api/users' });
    fastify.register(post_route_1.postRoutes, { prefix: '/api/posts' });
    fastify.register(friend_route_1.friendRoutes, { prefix: '/api/friends' });
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${port}`);
}
start().catch(err => {
    fastify.log.error(err);
    process.exit(1);
});
