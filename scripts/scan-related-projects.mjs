const token = process.env.GH_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const [owner, repo] = repository.split('/');
const api = async (path, options = {}) => {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', ...options.headers },
  });
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path}: ${response.status} ${await response.text()}`);
  return response.json();
};
const pages = async (query) => {
  const result = [];
  for (let page = 1; page <= 3; page++) {
    const data = await api(`/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=100&page=${page}`);
    result.push(...data.items);
    if (result.length >= data.total_count || data.items.length < 100) break;
  }
  return result;
};
const candidates = new Map();
for (const project of [...await pages('topic:dsh-plugin'), ...await pages('org:deepseek-ai')]) candidates.set(project.full_name, project);
const entries = new Set((await api(`/repos/${owner}/${repo}/contents/entries`)).filter((item) => item.name.endsWith('.json')).map((item) => item.name.toLowerCase()));
const issues = await api(`/repos/${owner}/${repo}/issues?state=all&per_page=100`);
let created = 0;
for (const project of candidates.values()) {
  const safeName = `github_${project.full_name.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`.toLowerCase();
  if (entries.has(safeName)) continue;
  if (issues.some((issue) => !issue.pull_request && issue.title.toLowerCase() === `add: ${project.full_name.toLowerCase()}`)) continue;
  const body = [
    '### Kind', '', 'plugin', '',
    '### Name', '', project.name, '',
    '### GitHub repository', '', project.full_name, '',
    '### npm package', '', '_No response_', '',
    '### Description', '', project.description || `Related DeepSeek Harness project: ${project.full_name}`, '',
    '### Tags', '', 'dsh-plugin, community', '',
    '### Submitter GitHub username', '', 'dsh-registry-bot', '',
    `<!-- Automatically discovered by the metadata scanner. Stars: ${project.stargazers_count}; updated: ${project.updated_at} -->`,
  ].join('\n');
  await api(`/repos/${owner}/${repo}/issues`, { method: 'POST', body: JSON.stringify({ title: `Add: ${project.full_name}`, body, labels: ['metadata-submission'] }), headers: { 'Content-Type': 'application/json' } });
  created++;
  console.log(`Opened issue for ${project.full_name}`);
}
console.log(`Scanned ${candidates.size} projects; opened ${created} issues.`);
