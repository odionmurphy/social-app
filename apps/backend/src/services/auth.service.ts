import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface RegisterInput {
  username: string
  email: string
  password: string
  displayName: string
}

interface LoginInput {
  email: string
  password: string
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, { username: input.username }]
    }
  })
  if (existing) throw new Error('Email or username already taken')

  const passwordHash = await bcrypt.hash(input.password, 12)

  const user = await prisma.user.create({
    data: {
      username:    input.username,
      email:       input.email,
      passwordHash,
      displayName: input.displayName,
    },
    select: {
      id: true, username: true, email: true,
      displayName: true, createdAt: true
    }
  })

  const { accessToken, refreshToken } = await generateTokens(user.id)
  return { user, accessToken, refreshToken }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email }
  })
  if (!user) throw new Error('Invalid credentials')

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) throw new Error('Invalid credentials')

  const { accessToken, refreshToken } = await generateTokens(user.id)
  const { passwordHash: _, ...safeUser } = user
  return { user: safeUser, accessToken, refreshToken }
}

async function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '30d' }
  )
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, expiresAt }
  })
  return { accessToken, refreshToken }
}
