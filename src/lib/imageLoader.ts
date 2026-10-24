"use client";

/**
 * Product photos are already compressed WebP files on the media host. Running
 * them through Vercel's optimiser would use up the Hobby plan's monthly image
 * transformations, so absolute URLs are returned untouched. Site artwork that
 * lives in /public still goes through /_next/image as before.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (/^https?:\/\//i.test(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}
