import { getSiteContent } from "@/lib/data/site";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { LaunchGate } from "./LaunchGate";
import { StoreProviders } from "./store/Providers";
import { Teaser } from "./Teaser";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();
  const shop = (
    <>
      <Header announcement={content.announcement.text} />
      <main>{children}</main>
      <Footer instagramUrl={content.instagram.url} />
    </>
  );
  return (
    <StoreProviders>
      {content.teaser.enabled ? (
        <LaunchGate teaser={<Teaser teaser={content.teaser} image={content.teaser.image || content.coming_soon.image} instagramUrl={content.instagram.url} />}>
          {shop}
        </LaunchGate>
      ) : (
        shop
      )}
    </StoreProviders>
  );
}
