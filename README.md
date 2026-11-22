# GPT UiO to OpenCode

Install dependencies with `npm install`, then run `make run` in a terminal.
The interactive setup checks which `GPT_UIO_RED_KEY`, `GPT_UIO_YELLOW_KEY`,
and `GPT_UIO_GREEN_KEY` environment variables are set, lets you choose providers
and whether to include deprecated models, and previews the output before writing.
It currently uses the bundled sample model list, not the live UiO API.

The generated config contains environment-variable references, not API keys.
The selected keys must also be available to the OpenCode process. Missing keys
are reported during setup and can be set later.

The default output is `processed-opencode-config.json` in the current directory.
OpenCode does not load that filename automatically: merge the generated provider
configuration into your existing `opencode.json` or `opencode.jsonc`, or choose an
appropriate config path. Writing an existing file replaces it after confirmation.
If another loaded configuration defines a provider or model, omitting it here
does not remove it from that other configuration.

Run `npm run typecheck` to check types and `npm test` for the focused tests.
