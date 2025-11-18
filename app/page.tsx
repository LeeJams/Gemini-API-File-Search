import { redirect } from "next/navigation";

/**
 * Root Page
 * Redirect to /stores page
 */
export default function HomePage() {
  redirect("/stores");
}
