import { prisma } from "./db";

const DAILY_MESSAGE_LIMIT = 120;

export async function checkUsageLimit(studentId: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let usage = await prisma.usageTracking.findUnique({
    where: {
      studentId_date: {
        studentId,
        date: today,
      },
    },
  });

  if (!usage) {
    usage = await prisma.usageTracking.create({
      data: {
        studentId,
        date: today,
        messageCount: 0,
      },
    });
  }

  const remaining = Math.max(0, DAILY_MESSAGE_LIMIT - usage.messageCount);
  return {
    allowed: usage.messageCount < DAILY_MESSAGE_LIMIT,
    remaining,
  };
}

export async function incrementUsage(studentId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.usageTracking.upsert({
    where: {
      studentId_date: {
        studentId,
        date: today,
      },
    },
    update: {
      messageCount: {
        increment: 1,
      },
    },
    create: {
      studentId,
      date: today,
      messageCount: 1,
    },
  });
}
