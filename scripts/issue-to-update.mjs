import { existsSync, readFileSync, writeFileSync } from 'node:fs';

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
  // GitHub Issue Forms use `_No response_` for an unanswered field.
  // Be tolerant of CRLF, HTML comments, and common manual placeholders.
  if (!value || /^_?no response_?$/i.test(value) || /^(n\/a|none|null|-)$/i.test(value)) return '';
  return value;
}

const id = optionalField('Entry id');
if (!id) throw new Error('Entry id is required');
if (!/^(github|npm|manual):.+/.test(id)) throw new Error('Entry id must use source:locator form, e.g. github:owner/repository');

const safeName = id.replace(/[^a-zA-Z0-9._-]/g, '_');
const filePath = `entries/${safeName}.json`;
if (!existsSync(filePath)) throw new Error(`Entry not found: ${id} (looked for ${filePath})`);

const entry = JSON.parse(readFileSync(filePath, 'utf8'));

let changed = false;

const name = optionalField('Name');
if (name) { entry.name = name; changed = true; }

const description = optionalField('Description');
if (description) { entry.description = description; changed = true; }

const tags = optionalField('Tags');
if (tags) {
  const parsedTags = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  if (!parsedTags.length) throw new Error('Tags must contain at least one value');
  entry.tags = parsedTags;
  changed = true;
}

const status = optionalField('Status');
if (status) {
  if (!['active', 'archived'].includes(status)) throw new Error('Status must be active or archived');
  entry.status = status;
  changed = true;
}

const official = optionalField('Official');
if (official) {
  if (!['true', 'false'].includes(official.toLowerCase())) throw new Error('Official must be true or false');
  entry.official = official.toLowerCase() === 'true';
  changed = true;
}

const githubRepo = optionalField('GitHub repository');
if (githubRepo) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(githubRepo)) throw new Error('GitHub repository must use owner/repository format');
  entry.githubRepo = githubRepo;
  entry.repositoryUrl = `https://github.com/${githubRepo}`;
  changed = true;
}

const npmPackage = optionalField('npm package');
if (npmPackage) {
  entry.npmPackage = npmPackage;
  if (!entry.githubRepo) entry.repositoryUrl = `https://www.npmjs.com/package/${npmPackage}`;
  changed = true;
}

// Keep source/sources consistent with the locators actually present; manual
// entries keep their source untouched when they have no locators.
const sources = [];
if (entry.githubRepo) sources.push('github');
if (entry.npmPackage) sources.push('npm');
if (sources.length) {
  entry.source = sources[0];
  entry.sources = [...new Set(sources)];
}

if (!changed) throw new Error('No fields to update were provided; fill in at least one field');

entry.updatedBy = submitter;
entry.updatedIssueNumber = issueNumber;

writeFileSync(filePath, `${JSON.stringify(entry, null, 2)}\n`);
console.log(`Updated ${filePath}`);
