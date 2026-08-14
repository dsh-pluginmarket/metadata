# DSH Registry Metadata

This repository is the source of truth for DSH Registry entries.

## Add an entry

Open a GitHub Issue using the **Add registry entry** template. The issue title starts with `Add:` so the workflow can trigger even if GitHub does not apply the optional label automatically. A GitHub Actions workflow validates the submitted fields and opens a pull request containing a metadata file. A maintainer reviews and merges that pull request; the Registry only publishes metadata from the default branch.

If no workflow run appears, verify that Actions are enabled in repository settings and that this workflow has been merged into the default branch. The workflow also validates metadata changes on pull requests.

## File format

Each entry is one JSON file under `entries/`:

```json
{
  "id": "github:owner/repository",
  "kind": "plugin",
  "name": "repository",
  "description": "Short description",
  "source": "github",
  "sources": ["github"],
  "githubRepo": "owner/repository",
  "repositoryUrl": "https://github.com/owner/repository",
  "tags": ["tooling"],
  "status": "active",
  "official": false
}
```

Supported kinds: `plugin`, `skill`, `preset`. Supported sources: `github`, `npm`, `manual`.
