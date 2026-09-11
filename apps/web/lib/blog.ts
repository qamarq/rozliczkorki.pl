import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  author: string;
  tags: string[];
  readingTime: number;
};

export type BlogPost = BlogPostMeta & {
  html: string;
};

function readingTimeOf(markdown: string) {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

async function parse(slug: string): Promise<BlogPost> {
  const raw = await fs.readFile(path.join(BLOG_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  const file = await remark().use(remarkGfm).use(remarkHtml).process(content);

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: String(data.date ?? ""),
    updated: data.updated ? String(data.updated) : undefined,
    author: String(data.author ?? "Zespół RozliczKorki"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingTime: readingTimeOf(content),
    html: String(file),
  };
}

export async function getPostSlugs() {
  const entries = await fs.readdir(BLOG_DIR);
  return entries.filter((e) => e.endsWith(".md")).map((e) => e.replace(/\.md$/, ""));
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    return await parse(slug);
  } catch {
    return null;
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const slugs = await getPostSlugs();
  const posts = await Promise.all(slugs.map(parse));
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
