# First Cut

AI first-haircut advisor for young children.

## Flow

1. Upload front / 45° / side photos.
2. A selectable vision-language model analyzes the child and proposes four haircut directions using `skills/first-haircut/SKILL.md`.
3. A selectable reference-image generation model renders four previews.

## Models

Analysis:
- `inclusionai/ling-3.0-flash-vl-free`
- `inclusionai/ling-3.0-flash-vl`

Image generation:
- `meta/muse-image-1.0`
- `spacexai/grok-imagine-image`
- `bytedance/seedream-5.0-lite`
- `bfl/flux-2-klein-9b`
- `bfl/flux-2-flex`
- `bfl/flux-2-pro`
- `bfl/flux-2-max`
- `openai/gpt-image-1.5`
- `openai/gpt-image-2`
- `openai/gpt-image-2.5-sunburst`
- `openai/gpt-image-2.5-flare`

## Development

```bash
npm install
npm run build
```

## Deployment

`main` is the production source branch for Vercel.

Designed for deployment on Vercel using AI Gateway.
