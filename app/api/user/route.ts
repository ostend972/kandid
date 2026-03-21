import { auth } from '@clerk/nextjs/server';
import { getUserById } from '@/lib/db/kandid-queries';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json(null);
  }

  const user = await getUserById(userId);
  return Response.json(user);
}
