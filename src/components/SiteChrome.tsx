import { getSiteContent } from "@/lib/data/site";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { StoreProviders } from "./store/Providers";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();
  return (
    <StoreProviders>
      <Header announcement={content.announcement.text} />
      <main>{children}</main>
      <Footer instagramUrl={content.instagram.url} />
    </StoreProviders>
  );
}
