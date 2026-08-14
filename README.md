# DSH Registry Metadata

This repository is the source of truth for DSH Registry entries.

## Add an entry

Open a GitHub Issue using the **Add registry entry** template. A GitHub Actions workflow validates the submitted fields and opens a pull request containing a metadata file. A maintainer reviews and merges that pull request; the Registry only publishes metadata from the default branch.

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
