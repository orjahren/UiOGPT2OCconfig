# GPT UiO to OpenCode

Generate an OpenCode configuration for GPT UiO's red, yellow and green
(Claude) providers.

**The model list is a bundled sample**, not live data from UiO. To use your
own list, sign in to GPT UiO, open
[the `/api/user/me` endpoint](https://gpt.uio.no/api/user/me), and copy the
relevant model array into `sampleResponse` in [`me.ts`](./me.ts), replacing
the sample array. Copy only the model data, not personal information.

## Get started

You need Node.js (tested with Node.js 22), npm, `make`, and a terminal.

```sh
npm install
make run
```

The wizard checks your API key variables, lets you choose providers and whether
to include deprecated models, then previews the output before writing. Press
Ctrl+C to cancel. Without `make`, run `npm run build && node dist/index.js`.

## API keys

Set the environment variables for the providers you want:

| Provider | Variable |
| --- | --- |
| Red | `GPT_UIO_RED_KEY` |
| Yellow | `GPT_UIO_YELLOW_KEY` |
| Green (Claude) | `GPT_UIO_GREEN_KEY` |

The generated file references these variables; it does not store their values.
They must also be available to the OpenCode process, including its background
service if you use one. Missing keys produce a warning and can be set later.
The green value is used as the Claude provider's `Authorization` header.

## Use the config

By default, the wizard writes `processed-opencode-config.json`. OpenCode does
not load that filename automatically: merge its provider entries into your
OpenCode configuration, or choose an appropriate config path in the wizard.
Back up existing settings first: confirming an overwrite replaces the entire
file. See [OpenCode's config guide](https://opencode.ai/docs/config/) for
locations and precedence.

The generated config also disables the built-in `opencode` provider. Review
that setting if you want to keep it enabled. Excluding a provider or model here
does not remove it from other OpenCode configuration files.

Deprecated models may still be unavailable even if you include them. Costs and
token limits are not translated yet.

## Development

Run `npm run typecheck` to check types and `npm test` to build and run tests.
