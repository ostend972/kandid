import { auth } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Bienvenue sur Kandid
      </h1>
      <p className="text-gray-600">
        Votre tableau de bord sera bient&ocirc;t disponible.
      </p>
    </section>
  );
}
