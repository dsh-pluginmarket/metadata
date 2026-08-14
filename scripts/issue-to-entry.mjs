import { writeFileSync, mkdirSync } from 'node:fs';

const body = process.env.ISSUE_BODY ?? '';
const issueNumber = Number(process.env.ISSUE_NUMBER);
const submitter = process.env.ISSUE_USER ?? '';

function field(label) {
  const sections = body.split(/^###\s+/m);
  const section = sections.find((part) => part.toLowerCase().startsWith(`${label.toLowerCase()}\n`));
  const value = section?.slice(section.indexOf('\n') + 1).trim() ?? '';
  return value === '_No response_' ? '' : value;
}

const kind = field('Kind').toLowerCase();
const name = field('Name');
const githubRepo = field('GitHub repository');
const npmPackage = field('npm package');
const description = field('Description');
const tags = field('Tags').split(',').map((tag) => tag.trim()).filter(Boolean);

if (!['plugin', 'skill', 'preset'].includes(kind)) throw new Error('Kind must be plugin, skill, or preset');
if (!name) throw new Error('Name is required');
if (!description) throw new Error('Description is required');
if (githubRepo && !/^[\w.-]+\/[\w.-]+$/.test(githubRepo)) throw new Error('GitHub repository must use owner/repository format');
if (!githubRepo && !npmPackage) throw new Error('GitHub repository or npm package is required');
if (githubRepo && npmPackage) throw new Error('Submit either a GitHub repository or npm package, not both');
if (!tags.length) throw new Error('At least one tag is required');

const source = githubRepo ? 'github' : 'npm';
const locator = githubRepo || npmPackage;
const id = `${source}:${locator}`;
const entry = {
  id, kind, name, description, source, sources: [source],
  ...(githubRepo ? { githubRepo, repositoryUrl: `https://github.com/${githubRepo}` } : { npmPackage, repositoryUrl: `https://www.npmjs.com/package/${npmPackage}` }),
  tags, status: 'pending', official: false, submittedBy: submitter, issueNumber,
};
const safeName = id.replace(/[^a-zA-Z0-9._-]/g, '_');
mkdirSync('entries', { recursive: true });
writeFileSync(`entries/${safeName}.json`, `${JSON.stringify(entry, null, 2)}\n`);
console.log(`Created entries/${safeName}.json`);
