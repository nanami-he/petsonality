# Contributing to Petsonality

Thanks for your interest! Here's how to contribute.

## Setup

```bash
git clone https://github.com/nanami-he/petsonality.git
cd petsonality
bun install
```

## Development

```bash
# Run MCP server directly
bun run server/index.ts

# Test status line
bash statusline/pet-status.sh

# Test hooks
echo '{"last_assistant_message":"test <!-- pet: hello -->"}' | bash hooks/pet-comment.sh
```

## Key Files

- `server/art.ts` — ASCII art (5 lines x 12 chars per frame)
- `server/pets.ts` — Personality profiles for all 16 animals
- `statusline/pet-status.sh` — Terminal rendering + animation
- `hooks/wrap.py` — CJK-aware text wrapping for bubbles

## Guidelines

- ASCII art must follow the fixed grid: 5 lines x 12 characters
- All pets face left (right-aligned display)
- Test on dark terminal backgrounds
- Keep shell scripts macOS compatible (bash 3.x)

## License

MIT — all contributions are under the same license.
