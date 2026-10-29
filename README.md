# zhang.workbench

English | [中文](README.zh.md)

`zhang.workbench` V0.1 is a locally customized workbench based on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It provides a folder-based workspace home, a simplified project chat view, optional API Key onboarding for multiple model providers, and cumulative session token usage. Folder information appears on hover at the right edge and does not display the local path. The upstream MIT license and source attribution are retained.

## Document workbench

The local workbench integrates the document, AI discussion, and change-review workflow from [Simin-Lab](https://github.com/chusimin/Simin-Lab), with its MIT attribution retained. Projects show a document list, Markdown reader, and the existing AI conversation together. New documents and AI-proposed edits require preview and confirmation before writing; cancelling leaves the document unchanged. The workbench retains the zhang.workbench brand and model-provider settings.

Projects use the checkout's ignored `projects/` directory by default. Existing workspaces and sessions are not moved: open **Settings → Existing workspaces and sessions** to use the previous interface. The document workflow currently supports Markdown and plain-text files; it does not import Simin-Lab's sample projects.

The workbench bundles Simin-Lab's ten AI product-management skills with their references and MIT attribution. In a project conversation, type `/aipm-` to select a workflow, or invoke `/aipm-problem-definition` followed by your task. They cover problem definition, user research and segmentation, product teardown, competitive analysis, requirements, prioritization, journeys, project initiation, and PRD review. The skills load independently of the project directory; the minimal preset has no skill loader. Documents default to Markdown and retain preview-before-save; the initiation HTML template is available only when explicitly requested. [Bundle details](packages/bundle/web-app/README.md).

Two additional workflows, `/agent-blueprint` and `/ai-product-starter`, adapt the supplied Agent Blueprint and AI Product Starter Kit projects for architecture planning, gap checks, and staged engineering delivery. Open **Product Toolkit** from Home to prepare the product workflow without typing a command. They use the current conversation's model and document review, not a separate engine or automatic deployment. [Scope and licenses](packages/bundle/web-app/README.md#use-this-package).

## Run this edition from source

Requires Node.js 22.19+ or 24+ and pnpm 11.7.0. Clone this repository, install dependencies, build, and launch the local Web UI:

```sh
git clone https://github.com/zhang1845/zhang.workbench.git
cd zhang.workbench
pnpm install
DSH_CLIENT_TITLE='zhang.workbench' pnpm build
pnpm dsh web
```

API Keys are configured inside the app and can be added later. Never commit keys, `.env`, `.dsh-home`, personal workspaces, or session data. V0.1 publishes source code; the existing local development App is not a portable installer. The package versions below belong to the upstream framework, independently of this edition's `V0.1` release tag.

### macOS source launcher

For an Apple Silicon or Intel Mac, install the supported Node.js and pnpm versions above, then run `pnpm install` in this checkout on the Mac. Double-click [start-workbench.command](start-workbench.command) in Finder. The entry resolves the checkout from its own location, installs the matching Electron binary through the existing installer, and requests a Desktop source rebuild before opening the workbench. Pulling an update and launching this entry therefore uses the updated Product Toolkit interface. For repeated use, create a Finder alias of this file and place the alias on the Desktop.

The Mac Desktop launch retains the existing development data locations: settings in `apps/desktop/.desktop-build/development/home/` and browser data in its sibling `electron-user-data/`. Explicit `DSH_HOME` and `DSH_DESKTOP_USER_DATA_DIR` values remain effective, with relative paths resolved from the checkout. Projects stay in `projects/`. Keep these data directories when moving the source, and install dependencies on each operating system rather than copying `node_modules` between Windows and Mac.

`./start-workbench.command --check` checks the native host, Node.js range, and local pnpm entry without downloading, building, or launching the application. `--web` selects the existing Web development entry and its existing home defaults. `--skip-build` explicitly reuses previous artifacts built with the same workbench title. The focused macOS workflow checks the executable entry and launcher behavior on Apple Silicon and Intel runners; interactive Finder/Electron acceptance remains a Mac-machine check. This source entry does not build an installer or update an already installed `.app`.

### Windows source launcher

For native Windows 10/11 x64, install a supported x64 Node.js and pnpm 11.7.0, then run `pnpm install` in a fresh Windows checkout. Do not copy macOS `node_modules`, `.app` bundles, or prepared runtimes. Enable Windows Developer Mode if local dependency links require it; the launcher does not change system permissions. Keep the source in a writable local directory and retain the repository's normal native-build prerequisites.

Double-click [start-workbench.cmd](start-workbench.cmd) to request a build and open the Desktop workbench. It resolves the source relative to the launcher, runs the existing Electron binary installer and Desktop development entry, and keeps the `zhang.workbench` client title. First use requires network access for dependencies and runtime downloads. Settings default to the checkout's ignored `.dsh-home/`, browser data to `.dsh-home/desktop-user-data/`, and documents to `projects/`; explicit data-directory environment variables are retained. Keep these directories when moving the checkout. API keys use the existing in-app setup rather than the launcher.

From a terminal, `start-workbench.cmd --check` checks the host, Node.js range, and local pnpm entry without building or downloading. `--web` selects the existing Web development entry; `--skip-build` uses existing artifacts only and requires a previous build made with the same workbench title. These launch plans have host-independent tests, but native Windows launch, caption controls, runtime downloads, and installer creation still require Windows-machine acceptance. This change does not produce a signed or unsigned `.exe`; upstream Windows packaging requires a Windows x64 build host and its separate release configuration.

## Upstream framework

DeepSeek Harness (`dsh`) is an open-source agent harness developed by [DeepSeek AI](https://deepseek.com).

It is built on an **everything-is-a-plugin** architecture and powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512).

Documentation: [https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

## Developer preview

DeepSeek Harness is in _developer preview_ and iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

Review the [safety notice](SAFETY.md) before running the project.

## Run

### Run from `npm`

Install `Node.js`, then run:

```sh
npx @deepseek-ai/dsh web
```

The command starts the Web UI at `http://127.0.0.1:3080` by default and opens it in the default browser for a local launch. An SSH launch only prints the host URL because the SSH client or editor owns the local forwarded address. Pass `--no-open` to run the server without opening a browser. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` prepares the repository artifacts. `pnpm dsh web` uses those built artifacts without rebuilding.

## Community and support

- Submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/4MrtZUhpxg">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

`pnpm run dev:web` builds, serves, and rebuilds client bundles on source edits in one terminal, and `make help` lists the matching Make targets for Web and Desktop; the guide's application commands section owns the full table.

For agents, follow [AGENTS.md](AGENTS.md).

## Citation

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
