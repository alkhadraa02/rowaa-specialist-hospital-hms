import SiteLayout from "./(site)/layout";
import HomePage from "./(site)/home";

export { metadata } from "./(site)/home";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  return (
    <SiteLayout>
      <HomePage />
    </SiteLayout>
  );
}
