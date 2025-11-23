import { redirect } from "next/navigation";

/**
 * Root Page
 * Redirect to /[locale]/stores page
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/stores`);
}
