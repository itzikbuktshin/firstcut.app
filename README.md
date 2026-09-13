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
- `bfl/flux-2-klein-9b`
- `bytedance/seedream-5.0-lite`
- `bfl/flux-2-pro`
- `bfl/flux-2-max`

## Development

```bash
npm install
npm run build
```

Designed for deployment on Vercel using AI Gateway.
