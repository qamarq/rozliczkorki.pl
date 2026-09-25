import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { PageTransition } from "@/components/marketing/page-transition";
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
    <PageTransition>
      <div
        aria-hidden
        className="reading-progress bg-primary fixed inset-x-0 top-0 z-50 h-[3px] origin-left"
      />
      <div className="site-container">
        <MarketingHeader />
      </div>

      <div className="site-container">
        <article className="mx-auto flex max-w-3xl flex-col gap-10 pb-24 pt-8 sm:pt-14">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground group flex w-fit items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Wszystkie wpisy
          </Link>

          <header className="flex flex-col gap-5">
            <h1 className="font-display mk-rise text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.015em] sm:text-5xl">
              {post.title}
            </h1>
            <p
              className="text-muted-foreground mk-rise text-pretty text-lg sm:text-xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              {post.description}
            </p>
            <div
              className="text-muted-foreground border-border mk-rise flex flex-wrap items-center gap-x-5 gap-y-2 border-y py-3 text-sm"
              style={{ "--i": 2 } as CSSProperties}
            >
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span>{post.readingTime} min czytania</span>
              <span>{post.author}</span>
              {post.tags.length > 0 && (
                <ul className="flex flex-wrap gap-2 sm:ml-auto">
                  {post.tags.map((tag) => (
                    <li
                      key={tag}
                      className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </header>

          <div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.html }} />

          <aside className="bg-inverse text-inverse-foreground border-inverse-border flex flex-col items-start gap-4 rounded-3xl border p-7 sm:p-9">
            <h2 className="text-balance text-2xl font-semibold sm:text-3xl">
              Pilnuj limitu bez zeszytu
            </h2>
            <p className="text-inverse-foreground/70 max-w-xl text-pretty">
              RozliczKorki liczy Twoje przychody na bieżąco. Widzisz, ile zarobiłaś w tym
              kwartale, kto jeszcze nie zapłacił i jak blisko progu jesteś.
            </p>
            <Link
              href="/register"
              className="bg-primary text-primary-foreground group inline-flex h-11 items-center gap-2 rounded-xl px-5 font-semibold transition-[filter] hover:brightness-110"
            >
              Zacznij za darmo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </aside>
        </article>
      </div>

      <div className="site-container">
        <MarketingFooter />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </PageTransition>
  );
}
