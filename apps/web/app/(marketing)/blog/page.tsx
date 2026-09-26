import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { Cta } from "@/components/marketing/cta";
import { PageTransition } from "@/components/marketing/page-transition";
import { Reveal } from "@/components/marketing/reveal";
import { formatDate, getAllPosts } from "@/lib/blog";
import { getServerSession } from "@/lib/auth-server";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Blog | RozliczKorki",
  description:
    "Podatki, rozliczenia i organizacja pracy korepetytora. Konkretnie, z podstawą prawną i bez lania wody.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default async function BlogIndexPage() {
  const [session, posts] = await Promise.all([getServerSession(), getAllPosts()]);

  return (
    <PageTransition>
      <div className="site-container">
        <MarketingHeader />
      </div>

      <div className="site-container pb-20 pt-10 sm:pt-16">
        <div className="flex max-w-2xl flex-col gap-4">
          <h1 className="font-display mk-rise text-5xl font-semibold leading-none tracking-[-0.018em] sm:text-6xl">
            Blog
          </h1>
          <p
            className="text-muted-foreground mk-rise text-pretty text-lg sm:text-xl"
            style={{ "--i": 1 } as CSSProperties}
          >
            Podatki, rozliczenia i organizacja pracy korepetytora. Konkretnie, z podstawą
            prawną i linkami do źródeł.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground mt-14">
            Pierwsze wpisy pojawią się wkrótce.
          </p>
        ) : (
          <Reveal className="border-border-solid divide-border-solid mt-14 divide-y border-y">
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="mk-reveal group grid gap-3 py-8 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-7"
                style={{ "--i": i } as CSSProperties}
              >
                <time dateTime={post.date} className="text-muted-foreground text-sm">
                  {formatDate(post.date)}
                </time>
                <div className="flex flex-col gap-3">
                  <h2 className="group-hover:text-accent-foreground text-balance text-[1.7rem] font-semibold leading-tight transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground max-w-2xl text-pretty">
                    {post.description}
                  </p>
                  {post.tags.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
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
                <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-1 whitespace-nowrap text-sm transition-colors">
                  {post.readingTime} min czytania
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </Reveal>
        )}

        <div className="pt-24">
          <Cta
            href={session ? "/dashboard" : "/register"}
            label={session ? "Przejdź do panelu" : "Załóż konto za darmo"}
          />
        </div>
      </div>

      <div className="site-container">
        <MarketingFooter />
      </div>
    </PageTransition>
  );
}
