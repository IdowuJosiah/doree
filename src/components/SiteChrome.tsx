import { getSiteContent } from "@/lib/data/site";
import { Footer } from "./Footer";
import { Header } from "./Header";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();
  return (
    <>
      <Header announcement={content.announcement.text} />
      <main>{children}</main>
      <Footer instagramUrl={content.instagram.url} />
    </>
  );
}
