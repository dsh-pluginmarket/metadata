import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const allowedKinds = new Set(['plugin', 'skill', 'preset', 'theme']);
const allowedSources = new Set(['github', 'npm', 'manual']);
const dir = new URL('../entries/', import.meta.url);
const files = (await readdir(dir)).filter((name) => name.endsWith('.json'));
const ids = new Set();
const errors = [];
for (const file of files) {
  let entry;
  try { entry = JSON.parse(await readFile(new URL(file, dir), 'utf8')); } catch (error) { errors.push(`${file}: invalid JSON (${error.message})`); continue; }
  for (const field of ['id', 'kind', 'name', 'description', 'source', 'sources', 'tags', 'status', 'official']) if (!(field in entry)) errors.push(`${file}: missing ${field}`);
  if (ids.has(entry.id)) errors.push(`${file}: duplicate id ${entry.id}`); ids.add(entry.id);
  if (!allowedKinds.has(entry.kind)) errors.push(`${file}: invalid kind`);
  if (!allowedSources.has(entry.source)) errors.push(`${file}: invalid source`);
  if (!Array.isArray(entry.sources) || entry.sources.some((source) => !allowedSources.has(source))) errors.push(`${file}: invalid sources`);
  if (!Array.isArray(entry.tags) || entry.tags.some((tag) => typeof tag !== 'string')) errors.push(`${file}: tags must be strings`);
  if (entry.source === 'github' && !/^[-\w.]+\/[-\w.]+$/.test(entry.githubRepo ?? '')) errors.push(`${file}: github entries require githubRepo owner/repo`);
  if (entry.source === 'npm' && typeof entry.npmPackage !== 'string') errors.push(`${file}: npm entries require npmPackage`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Validated ${files.length} metadata entries.`);
