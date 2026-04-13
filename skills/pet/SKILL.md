---
name: pet
description: "Your MBTI pet companion. Use when the user types /pet or mentions their pet by name."
argument-hint: "[show|pet|off|on|setup|rename <name>]"
allowed-tools: mcp__petsonality__*
---

# Pet — Your MBTI Companion

Handle the user's `/pet` command using the petsonality MCP tools.

## Command Routing

Based on `$ARGUMENTS`:

| Input | Action |
|-------|--------|
| *(empty)* or `show` | Call `pet_show`. **If the result contains "还没有宠物", immediately call `pet_setup` without asking.** |
| `pet` | Call `pet_pet` |
| `setup` | Call `pet_setup` |
| `browse` | Call `pet_browse` |
| `off` | Call `pet_mute` |
| `on` | Call `pet_unmute` |
| `rename <name>` | Call `pet_rename` with the given name |

## Adoption Flow

When `pet_show` result contains "还没有宠物" or user calls `pet_setup`:

1. Call `pet_setup` — shows MBTI selection menu
2. User picks a number or types their MBTI
3. Call `pet_recommend` with their MBTI — shows 2 recommendations + free choice
4. User picks 1, 2, or 3
5. If 3: call `pet_browse` — shows all 16 pets
6. Once user picks an animal, ask: "给你的新宠物起个名字吧（输入名字，或说「默认」用默认名）"
7. If user says "默认"、"default"、"ok"、"好" or similar, call `pet_adopt` WITHOUT the name parameter (server will use default)
8. Otherwise call `pet_adopt` with the user's chosen name
9. Display the adoption card

## CRITICAL OUTPUT RULES

The MCP tools return pre-formatted ASCII art with box-drawing characters. This is the pet's visual identity.

**You MUST output the tool result text EXACTLY as returned — character for character, line for line.** Do NOT:
- Summarize or paraphrase the ASCII art
- Describe what the pet looks like in prose
- Add commentary before or after the card
- Reformat, rephrase, or interpret the output

**Just output the raw text content from the tool result. Nothing else.** The ASCII art IS the response.

When the user mentions the pet by name, respond briefly in character using the personality from `pet://prompt`. Do NOT call `pet_react` — use `<!-- pet: ... -->` HTML comments instead (the Stop hook handles display).
