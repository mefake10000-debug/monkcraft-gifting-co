#!/usr/bin/env node
/**
 * Upload the product photos the catalogue references to Cloudinary.
 *
 * Each photo keeps its catalogue path as its Cloudinary public ID, so it is
 * served at <base>/catalogue-media/products/.../name.webp and the site only
 * needs MONKCRAFT_MEDIA_BASE_URL=<base> (see --print-base-url).
 *
 * Usage (from the project folder):
 *   node scripts/upload-media-to-cloudinary.mjs --source <catalogue-media folder> [--source <another>] --dry-run
 *   node scripts/upload-media-to-cloudinary.mjs --source ... --limit 5        (small test upload)
 *   node scripts/upload-media-to-cloudinary.mjs --source ...                  (everything; safe to re-run)
 *   node scripts/upload-media-to-cloudinary.mjs --source ... --verify         (check 200 random photos are live)
 *   node scripts/upload-media-to-cloudinary.mjs --print-base-url
 *
 * Credentials are read from a file OUTSIDE the project (default
 * ~/monkcraft-cloudinary.env, override with --env-file) containing:
 *   CLOUDINARY_CLOUD_NAME=...  CLOUDINARY_API_KEY=...  CLOUDINARY_API_SECRET=...
 * They are never printed. Progress is kept in ~/monkcraft-cloudinary-progress.json
 * so an interrupted run resumes where it stopped.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const has = (name) => args.includes(name);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const sources = args.flatMap((arg, i) => (arg === "--source" ? [path.resolve(args[i + 1])] : []));
const limit = Number(option("--limit", 0)) || Infinity;
const envFile = path.resolve(option("--env-file", path.join(os.homedir(), "monkcraft-cloudinary.env")));
const progressFile = path.join(os.homedir(), "monkcraft-cloudinary-progress.json");
const CONCURRENCY = 6;

function readCredentials() {
  if (!fs.existsSync(envFile)) throw new Error(`Credentials file not found: ${envFile}`);
  const values = Object.fromEntries(fs.readFileSync(envFile, "utf8").split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]));
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = values;
  if (!cloud || !key || !secret) throw new Error("The credentials file must set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
  return { cloud, key, secret };
}

if (has("--print-base-url")) {
  console.log(`https://res.cloudinary.com/${readCredentials().cloud}/image/upload`);
  process.exit(0);
}

// Every photo the site can show from /catalogue-media (catalogue + overrides).
const catalogue = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/export/products.json"), "utf8"));
const overrides = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/productImageOverrides.json"), "utf8"));
const wanted = new Set();
for (const rawPath of [...catalogue.products.flatMap((p) => (p.images ?? []).map((i) => i.path)), ...overrides.map((o) => o.path)]) {
  const rel = rawPath.startsWith("media/") ? rawPath.slice(6) : rawPath.startsWith("/catalogue-media/") ? rawPath.slice(17) : null;
  if (rel) wanted.add(rel);
}

const items = [];
const notFound = [];
for (const rel of [...wanted].sort()) {
  const file = sources.map((s) => path.join(s, ...rel.split("/"))).find((f) => fs.existsSync(f));
  const publicId = `catalogue-media/${rel.replace(/\.[^./]+$/, "")}`;
  if (!file) notFound.push(rel);
  else if (publicId.length > 255 || /[?&#\\%<>+]/.test(publicId)) notFound.push(`${rel} (unusable Cloudinary ID)`);
  else items.push({ file, publicId, ext: path.extname(rel).slice(1), size: fs.statSync(file).size });
}
const totalMb = (items.reduce((sum, i) => sum + i.size, 0) / 1e6).toFixed(0);
console.log(`Photos the site uses: ${wanted.size} | found locally: ${items.length} (${totalMb} MB) | not found: ${notFound.length}`);
if (notFound.length) console.log("Not found (first 5):", notFound.slice(0, 5));
if (has("--dry-run")) process.exit(notFound.length ? 1 : 0);
if (notFound.length) throw new Error("Some photos are missing locally; fix --source folders (see list above) before uploading.");

const { cloud, key, secret } = readCredentials();
const done = new Set(fs.existsSync(progressFile) ? JSON.parse(fs.readFileSync(progressFile, "utf8")) : []);
const saveProgress = () => fs.writeFileSync(progressFile, JSON.stringify([...done]));
process.on("SIGINT", () => { saveProgress(); process.exit(130); });

async function uploadOne({ file, publicId }) {
  for (let attempt = 1; ; attempt += 1) {
    const params = { overwrite: "false", public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)), unique_filename: "false", use_filename: "false" };
    const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
    const form = new FormData();
    for (const [k, v] of Object.entries(params)) form.append(k, v);
    form.append("api_key", key);
    form.append("signature", crypto.createHash("sha1").update(toSign + secret).digest("hex"));
    form.append("file", new Blob([fs.readFileSync(file)]), path.basename(file));
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
      if (res.ok) return;
      const message = (await res.json().catch(() => ({}))).error?.message ?? `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403) throw Object.assign(new Error(message), { fatal: true });
      if (res.status < 500 && res.status !== 420 && res.status !== 429) throw new Error(message);
      if (attempt >= 5) throw new Error(message);
    } catch (error) {
      if (error.fatal || attempt >= 5) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt ** 2));
  }
}

if (has("--verify") || has("--verify-all")) {
  const pool = has("--verify-all") ? items : [...items].sort(() => Math.random() - 0.5).slice(0, 200);
  let bad = 0;
  for (const item of pool) {
    const res = await fetch(`https://res.cloudinary.com/${cloud}/image/upload/${item.publicId}.${item.ext}`, { method: "HEAD" });
    if (!res.ok) { bad += 1; if (bad <= 5) console.log(`NOT LIVE (${res.status}): ${item.publicId}.${item.ext}`); }
  }
  console.log(`Verified ${pool.length} photos: ${pool.length - bad} live, ${bad} problems`);
  process.exit(bad ? 1 : 0);
}

const queue = items.filter((i) => !done.has(i.publicId)).slice(0, limit);
console.log(`Already uploaded: ${done.size} | to upload now: ${queue.length}`);
const failures = [];
let next = 0; let uploaded = 0; let stop = false;
async function worker() {
  while (!stop && next < queue.length) {
    const item = queue[next++];
    try {
      await uploadOne(item);
      done.add(item.publicId); uploaded += 1;
      if (uploaded % 250 === 0) { saveProgress(); console.log(`  ${uploaded}/${queue.length} uploaded`); }
    } catch (error) {
      failures.push(`${item.publicId}: ${error.message}`);
      if (error.fatal) { stop = true; console.log(`Stopping: ${error.message}`); }
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
saveProgress();
console.log(`Done. Uploaded this run: ${uploaded} | failed: ${failures.length}`);
if (failures.length) console.log(failures.slice(0, 10).join("\n"));
process.exit(failures.length ? 1 : 0);
