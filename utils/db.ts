import { PrismaClient } from '@prisma/client';

// We assignin prisma instance to 'globalThis' object (special Node global object)
// to use be able to check if we have already created a prisma connection
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Here we are limiting the amount of connection on the server
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

// We do this below because nextjs does hard reload and the connection might be broken eventualy
// because it would not have capacity to make a new database connections
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
