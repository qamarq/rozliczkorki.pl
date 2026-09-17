import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getPost, getPostSlugs } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: `${post.title} | RozliczKorki`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "RozliczKorki" },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-10">
      <MarketingHeader />

      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Wszystkie wpisy
        </Link>

        <header className="flex flex-col gap-4">
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="text-muted-foreground text-pretty text-lg">{post.description}</p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-4" />
              {post.readingTime} min czytania
            </span>
            <span>{post.author}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </header>

        <div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.html }} />

        <aside className="border-border-solid bg-card/60 flex flex-col items-start gap-3 rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Pilnuj limitu bez zeszytu</h2>
          <p className="text-muted-foreground text-pretty text-sm">
            RozliczKorki liczy Twoje przychody na bieżąco. Widzisz, ile zarobiłaś w tym
            kwartale, kto jeszcze nie zapłacił i jak blisko progu jesteś.
          </p>
          <Button asChild>
            <Link href="/register">Zacznij za darmo</Link>
          </Button>
        </aside>
      </article>

      <MarketingFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
