import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { contentDefaults, type LookbookPhoto } from "@/lib/data/site";
import { PAGE_SLUGS } from "../_lib";
import { Card, Check, Field, Notice, Save, Small, TextArea } from "../_components/ui";
import { ImageUploader } from "../_components/ImageUploader";
import {
  addLookbookPhotos, clearContentImage, deleteLookbookPhoto, moveLookbookPhoto,
  saveContent, saveLookbookPhoto, savePage, setContentImage,
} from "./actions";

export const metadata: Metadata = { title: "Site content" };

type Block = Record<string, string>;

function Image({ contentKey, field, url, label }: { contentKey: string; field: string; url: string; label: string }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      {url && (
        <div className="mb-2 flex items-end gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="max-h-32 w-auto" />
          <form action={clearContentImage.bind(null, contentKey, field)}><Small danger>Remove</Small></form>
        </div>
      )}
      <ImageUploader folder="site" onUploaded={setContentImage.bind(null, contentKey, field)} label={url ? "Replace photo" : "Upload photo"} />
    </div>
  );
}

export default async function ContentPage({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const db = await adminDb();
  const { data } = await db.from("site_content").select("key, value");
  const rows = new Map((data ?? []).map((r) => [r.key as string, r.value as Block]));
  const get = (key: keyof typeof contentDefaults): Block => ({ ...(contentDefaults[key] as unknown as Block), ...(rows.get(key) ?? {}) });

  const hero = get("home_hero");
  const statement = get("brand_statement");
  const feature = get("feature_panel");
  const insta = get("instagram");
  const announcement = get("announcement");
  const comingSoon = { ...contentDefaults.coming_soon, ...((rows.get("coming_soon") as unknown as Partial<typeof contentDefaults.coming_soon>) ?? {}) };
  const lookbook = ((rows.get("lookbook") as unknown as { photos?: LookbookPhoto[] })?.photos ?? []);

  return (
    <>
      <h1 className="mb-6 font-display text-4xl uppercase">Site content</h1>
      <Notice searchParams={searchParams} />

      <Card title="Announcement bar" hint="One line above the header. Leave empty to hide it.">
        <form action={saveContent.bind(null, "announcement")} className="max-w-xl space-y-4">
          <Field label="Text" name="text" defaultValue={announcement.text} />
          <Save />
        </form>
      </Card>

      <Card title="Home hero">
        <form action={saveContent.bind(null, "home_hero")} className="grid max-w-xl gap-4">
          <Field label="Script line" name="script" defaultValue={hero.script} />
          <Field label="Collection name" name="title" defaultValue={hero.title} />
          <Field label="Button label" name="buttonLabel" defaultValue={hero.buttonLabel} />
          <Field label="Button link" name="buttonHref" defaultValue={hero.buttonHref} hint="A path such as /shop/rings, or a full https link." />
          <div><Save /></div>
        </form>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Image contentKey="home_hero" field="leftImage" url={hero.leftImage} label="Left photo" />
          <Image contentKey="home_hero" field="rightImage" url={hero.rightImage} label="Right photo" />
        </div>
      </Card>

      <Card title="Brand statement">
        <form action={saveContent.bind(null, "brand_statement")} className="max-w-xl space-y-4">
          <TextArea label="Statement" name="text" defaultValue={statement.text} rows={3} />
          <Save />
        </form>
      </Card>

      <Card title="Feature panel">
        <form action={saveContent.bind(null, "feature_panel")} className="grid max-w-xl gap-4">
          <Field label="Script line" name="script" defaultValue={feature.script} />
          <Field label="Collection name" name="title" defaultValue={feature.title} />
          <TextArea label="One sentence" name="text" defaultValue={feature.text} rows={2} />
          <Field label="Button label" name="buttonLabel" defaultValue={feature.buttonLabel} />
          <Field label="Button link" name="buttonHref" defaultValue={feature.buttonHref} />
          <div><Save /></div>
        </form>
        <div className="mt-6"><Image contentKey="feature_panel" field="image" url={feature.image} label="Photo" /></div>
      </Card>

      <Card title="Coming soon" hint="The last section of the home page: the upcoming collection with an email sign-up. Switch it off to show a plain newsletter sign-up instead. Sign-ups are listed under Subscribers.">
        <form action={saveContent.bind(null, "coming_soon")} className="grid max-w-xl gap-4">
          <Check label="Show the upcoming collection" name="enabled" defaultChecked={comingSoon.enabled} />
          <Field label="Script line" name="script" defaultValue={comingSoon.script} />
          <Field label="Collection name" name="title" defaultValue={comingSoon.title} />
          <TextArea label="Short text" name="text" defaultValue={comingSoon.text} rows={2} />
          <Field label="Launch line (optional)" name="launch" defaultValue={comingSoon.launch} hint="For example: Launching March 2027" />
          <div><Save /></div>
        </form>
        <div className="mt-6"><Image contentKey="coming_soon" field="image" url={comingSoon.image} label="Teaser photo (shown in an arch)" /></div>
      </Card>

      <Card title="Instagram" hint="Used for the Instagram link in the footer.">
        <form action={saveContent.bind(null, "instagram")} className="grid max-w-xl gap-4">
          <Field label="Handle" name="handle" defaultValue={insta.handle} />
          <Field label="Profile link" name="url" defaultValue={insta.url} hint="Must start with https://" />
          <div><Save /></div>
        </form>
      </Card>

      <Card title="Lookbook photos" hint="Each photo needs alt text and can link to a product by its slug.">
        <ul className="space-y-6">
          {lookbook.map((p, i) => (
            <li key={`${p.url}-${i}`} className="flex flex-wrap items-start gap-4 border-b border-line pb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-32 w-auto" />
              <form action={saveLookbookPhoto.bind(null, i)} className="grid gap-3">
                <Field label="Alt text" name="alt" defaultValue={p.alt} required />
                <Field label="Product slug (optional)" name="productSlug" defaultValue={p.productSlug ?? ""} />
                <div><Small>Save photo</Small></div>
              </form>
              <div className="flex gap-2">
                {i > 0 && <form action={moveLookbookPhoto.bind(null, i, "up")}><Small>Earlier</Small></form>}
                {i < lookbook.length - 1 && <form action={moveLookbookPhoto.bind(null, i, "down")}><Small>Later</Small></form>}
                <form action={deleteLookbookPhoto.bind(null, i)}><Small danger>Delete</Small></form>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4"><ImageUploader folder="lookbook" multiple onUploaded={addLookbookPhotos} label="Add photos" /></div>
      </Card>

      {PAGE_SLUGS.map(({ slug, label }) => {
        const page = rows.get(`page:${slug}`) ?? {};
        return (
          <Card key={slug} title={label} hint={`Text page at /${slug === "about" ? "about" : ["shipping", "returns", "privacy", "terms"].includes(slug) ? `policies/${slug}` : `guides/${slug}`}. Blank lines start a new paragraph, "## " starts a heading and "- " a bullet.`}>
            <form action={savePage.bind(null, slug)} className="grid max-w-2xl gap-4">
              <Field label="Title" name="title" defaultValue={page.title ?? label} />
              <TextArea label="Short intro" name="intro" defaultValue={page.intro ?? ""} rows={2} />
              <TextArea label="Content" name="body" defaultValue={page.body ?? ""} rows={10} />
              <div><Save /></div>
            </form>
          </Card>
        );
      })}
    </>
  );
}
