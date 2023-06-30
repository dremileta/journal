import { auth } from '@clerk/nextjs';
import { prisma } from './db';

/**
 * Util function that associate our clerk user with the user of our database (planetscale)
 */
export const getUserByClerkId = async () => {
  const { userId } = auth();

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      clerkId: userId ?? '',
    },
  });

  return user;
};
