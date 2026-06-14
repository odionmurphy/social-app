"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function authenticate(req, reply) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'No token provided' });
    }
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.currentUser = { id: payload.userId };
    }
    catch {
        return reply.status(401).send({ error: 'Token expired or invalid' });
    }
}
