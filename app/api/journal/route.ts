import { analyze } from '@/utils/ai';
import { getUserByClerkId } from '@/utils/auth';
import { prisma } from '@/utils/db';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export const POST = async () => {
  const user = await getUserByClerkId();
  const entry = await prisma.journalEntry.create({
    data: {
      userId: user.id,
      content: 'New card',
    },
  });

  const analysis = await analyze(entry.content);
  await prisma.analysis.create({
    data: {
      userId: user.id,
      entryId: entry.id,

      ...analysis,
      mood: analysis?.mood ?? 'Neutral',
      summary: analysis?.summary ?? 'Nothig here',
      subject: analysis?.subject ?? 'No subject',
      color: analysis?.color ?? '#cccccc',
      negative: analysis?.negative ?? false,
    },
  });

  revalidatePath('/journal');
  return NextResponse.json({ data: entry });
};
