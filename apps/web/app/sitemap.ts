import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
      { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.4 },
      { url: `${SITE_URL}/register`, changeFrequency: "yearly", priority: 0.5 },
      { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/delete-account`, changeFrequency: "yearly", priority: 0.1 },
    ] satisfies MetadataRoute.Sitemap
  ).map((route) => ({ ...route, lastModified: new Date() }));

  return [
    ...staticRoutes,
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
