"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function registerUser(input) {
    const existing = await prisma.user.findFirst({
        where: {
            OR: [{ email: input.email }, { username: input.username }]
        }
    });
    if (existing)
        throw new Error('Email or username already taken');
    const passwordHash = await bcryptjs_1.default.hash(input.password, 12);
    const user = await prisma.user.create({
        data: {
            username: input.username,
            email: input.email,
            passwordHash,
            displayName: input.displayName,
        },
        select: {
            id: true, username: true, email: true,
            displayName: true, createdAt: true
        }
    });
    const { accessToken, refreshToken } = await generateTokens(user.id);
    return { user, accessToken, refreshToken };
}
async function loginUser(input) {
    const user = await prisma.user.findUnique({
        where: { email: input.email }
    });
    if (!user)
        throw new Error('Invalid credentials');
    const valid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!valid)
        throw new Error('Invalid credentials');
    const { accessToken, refreshToken } = await generateTokens(user.id);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
}
async function generateTokens(userId) {
    const accessToken = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
        data: { token: refreshToken, userId, expiresAt }
    });
    return { accessToken, refreshToken };
}
