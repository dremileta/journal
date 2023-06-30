import { prisma } from '@/utils/db';
import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

const createNewUser = async () => {
  /**
   * We dont do check here on user logged in or not.
   * Because we forbid user to go to this route if they are not logged in inside our middleware (check file).
   */
  const user = await currentUser();

  const match = await prisma.user.findUnique({
    where: {
      clerkId: user?.id as string,
    },
  });

  if (!match) {
    await prisma.user.create({
      data: {
        clerkId: user?.id as string,
        email: user?.emailAddresses[0].emailAddress as string,
      },
    });
  }

  redirect('/journal');
};

/**
 *
 */
const NewUserPage = async () => {
  await createNewUser();
  return <div>...loading</div>;
};

export default NewUserPage;
