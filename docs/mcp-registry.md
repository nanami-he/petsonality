# MCP Registry publishing

Petsonality registry name: `io.github.nanami-he/petsonality`

The official MCP Registry validates npm packages by checking that the published package's `package.json` has an `mcpName` field matching `server.json#name`.

## Current state

- `server.json` is ready for the MCP Registry.
- `package.json#mcpName` is ready for the next npm publish.
- The currently published `petsonality@0.4.5` package was published before `mcpName` existed, so registry publishing should wait for the next package version.

## Publish checklist

1. Run `bun test`.
2. Run `bun run build`.
3. Publish the next npm version so npm contains `mcpName`.
4. Install or update `mcp-publisher`.
5. Run `mcp-publisher login github`.
6. Run `mcp-publisher publish`.
7. Verify with:

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.nanami-he/petsonality"
```
