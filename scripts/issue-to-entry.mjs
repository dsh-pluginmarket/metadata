import { writeFileSync, mkdirSync } from 'node:fs';

const body = process.env.ISSUE_BODY ?? '';
const issueNumber = Number(process.env.ISSUE_NUMBER);
const submitter = process.env.ISSUE_USER ?? '';

function field(label) {
  const sections = body.split(/^###\s+/m);
  const section = sections.find((part) => part.toLowerCase().startsWith(`${label.toLowerCase()}\n`));
  const value = section?.slice(section.indexOf('\n') + 1).trim() ?? '';
  return value;
}

function optionalField(label) {
  const value = field(label).trim();
  // GitHub Issue Forms use `_No response_` for an unanswered optional field.
  // Be tolerant of CRLF, HTML comments, and common manual placeholders.
  if (!value || /^_?no response_?$/i.test(value) || /^(n\/a|none|null|-)$/i.test(value)) return '';
  return value;
}

const kind = field('Kind').toLowerCase();
const name = field('Name');
const githubRepo = optionalField('GitHub repository');
const npmPackage = optionalField('npm package');
const description = field('Description').trim();
const tags = field('Tags').split(',').map((tag) => tag.trim()).filter(Boolean);

if (!['plugin', 'skill', 'preset', 'theme'].includes(kind)) throw new Error('Kind must be plugin, skill, preset, or theme');
if (!name) throw new Error('Name is required');
if (!description) throw new Error('Description is required');
if (githubRepo && !/^[\w.-]+\/[\w.-]+$/.test(githubRepo)) throw new Error('GitHub repository must use owner/repository format');
if (!githubRepo && !npmPackage) throw new Error('GitHub repository or npm package is required');
if (!tags.length) throw new Error('At least one tag is required');

// A project may publish both on GitHub and npm. GitHub is the canonical
// source when present, while both locators are retained in the registry entry.
const source = githubRepo ? 'github' : 'npm';
const sources = [ ...(githubRepo ? ['github'] : []), ...(npmPackage ? ['npm'] : []) ];
const locator = githubRepo || npmPackage;
const entry = {
  id: `${source}:${locator}`, kind, name, description, source, sources,
  ...(githubRepo ? { githubRepo, repositoryUrl: `https://github.com/${githubRepo}` } : {}),
  ...(npmPackage ? { npmPackage } : {}),
  ...(!githubRepo && npmPackage ? { repositoryUrl: `https://www.npmjs.com/package/${npmPackage}` } : {}),
  tags, status: 'active', official: false, submittedBy: submitter, issueNumber,
};
const id = entry.id;
const safeName = id.replace(/[^a-zA-Z0-9._-]/g, '_');
mkdirSync('entries', { recursive: true });
writeFileSync(`entries/${safeName}.json`, `${JSON.stringify(entry, null, 2)}\n`);
console.log(`Created entries/${safeName}.json`);
