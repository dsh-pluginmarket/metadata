# DSH Registry Metadata

This repository is the source of truth for DSH Registry entries.

## Add an entry

Open a GitHub Issue using the **Add registry entry** template. The issue title starts with `Add:` so the workflow can trigger even if GitHub does not apply the optional label automatically. A GitHub Actions workflow validates the submitted fields and opens a pull request containing a metadata file. A maintainer reviews and merges that pull request; the Registry only publishes metadata from the default branch. Generated entries use `status: active` because the pull request itself is the moderation gate. Merging the pull request automatically closes the originating issue.

If no workflow run appears, verify that Actions are enabled in repository settings and that this workflow has been merged into the default branch. The workflow also validates metadata changes on pull requests.

For issues that were created before the automatic workflow was installed, run **Actions → Backfill existing metadata issues → Run workflow**. Leave the issue number empty to scan all open issues whose title starts with `Add:` or `Update:` (or that have the `metadata-submission` label), or provide one issue number to process only that issue. The workflow generates one maintainer-review PR, avoids creating duplicate backfill PRs, and lists the processed issues in the PR body so merging the PR closes them automatically.

## Update an entry

Open a GitHub Issue using the **Update registry entry** template. The issue title starts with `Update:` so the workflow triggers automatically. Fill in the id of the existing entry (for example `github:owner/repository`) and only the fields you want to change; empty fields keep the current values. The workflow applies the changes to the existing metadata file, validates it, and opens a maintainer-review pull request with `Closes #<issue>`, so merging the pull request publishes the update and closes the issue automatically. Supported status values are `active` and `archived`.

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
  "npmPackage": "@scope/package",
  "repositoryUrl": "https://github.com/owner/repository",
  "tags": ["tooling"],
  "status": "active",
  "official": false
}
```

Supported kinds: `plugin`, `skill`, `preset`, `theme`. Supported sources: `github`, `npm`, `manual`. GitHub and npm may be provided together.

## GitHub App setup

The workflows use the `deepseek-harness-plugin` GitHub App to create branches, comment on issues, and open pull requests. The project scanner also opens Issues with the App token: GitHub never triggers workflows for events created with `GITHUB_TOKEN`, so the scanner must use the App token for the validate-and-pr workflow to run. Add these repository secrets:

- `METADATA_APP_ID`: `4595886`
- `METADATA_APP_PRIVATE_KEY`: the complete downloaded `.pem` private key

Install the App on `dsh-pluginmarket/metadata` with **Contents**, **Issues**, and **Pull requests** set to **Read and write**. The Client ID and Client secret are OAuth credentials and are not used by Actions. Never commit or share the private key.

## Automatic project discovery

`.github/workflows/scan-related-projects.yml` runs weekly and can also be started manually from **Actions → Scan related DSH projects → Run workflow**. It scans GitHub repositories with the `dsh-plugin` topic and the `deepseek-ai` organization, skips entries and duplicate Issues already known to this repository, and opens an `Add:` metadata Issue for each new project. The existing Issue workflow then validates the submission and creates the maintainer-review PR.

Manual runs accept an optional **`github_token`** input: a personal access token or App token to use instead of the default GitHub App token, for example when the App token is hitting GitHub's rate limits. Leave it empty to use the default. The scanner spaces out Issue creation and retries rate-limited requests automatically.
