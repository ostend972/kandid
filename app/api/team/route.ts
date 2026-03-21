import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json(null);
  }

  // Legacy team concept is not used in Kandid.
  // Return null for backward compatibility with boilerplate components.
  return Response.json(null);
}
