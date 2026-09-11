import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Blog — RozliczKorki",
  description:
    "Podatki, rozliczenia i organizacja pracy korepetytora. Konkretnie, z podstawą prawną i bez lania wody.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-10">
      <MarketingHeader />

      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="text-muted-foreground max-w-2xl text-pretty text-lg">
          Podatki, rozliczenia i organizacja pracy korepetytora — konkretnie, z podstawą
          prawną i linkami do źródeł.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {posts.length === 0 && (
          <p className="text-muted-foreground">Pierwsze wpisy pojawią się wkrótce.</p>
        )}

        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <Card className="border-border-solid hover:border-primary/50 transition-colors">
              <CardHeader className="gap-2">
                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="size-3.5" />
                    {post.readingTime} min czytania
                  </span>
                </div>
                <CardTitle className="group-hover:text-primary text-xl transition-colors">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-muted-foreground text-pretty">{post.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-primary ml-auto flex items-center gap-1 text-sm font-medium">
                    Czytaj
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <MarketingFooter />
    </div>
  );
}
