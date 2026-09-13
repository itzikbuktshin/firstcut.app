import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateText, generateImage } from 'ai';

export const runtime = 'nodejs';
export const maxDuration = 180;

const DEFAULT_ANALYSIS_MODEL = 'inclusionai/ling-3.0-flash-vl-free';
const ALLOWED_ANALYSIS_MODELS = new Set([
  'inclusionai/ling-3.0-flash-vl',
  'inclusionai/ling-3.0-flash-vl-free',
]);

const DEFAULT_IMAGE_MODEL = 'meta/muse-image-1.0';
const ALLOWED_IMAGE_MODELS = new Set([
  'meta/muse-image-1.0',
  'bytedance/seedream-5.0-lite',
  'bfl/flux-2-klein-9b',
  'bfl/flux-2-pro',
  'bfl/flux-2-max',
]);

function normalizeAnalysisModel(model) {
  return ALLOWED_ANALYSIS_MODELS.has(model) ? model : DEFAULT_ANALYSIS_MODEL;
}

function normalizeImageModel(model) {
  return ALLOWED_IMAGE_MODELS.has(model) ? model : DEFAULT_IMAGE_MODEL;
}

function parseJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Agent returned an invalid response');
  return JSON.parse(text.slice(start, end + 1));
}

function buildImagePrompt(option, preferences, trimCadence, stylingLevel, photos) {
  return {
    text: [
      'Create a realistic first-haircut preview of the SAME child shown in the reference images.',
      "Preserve the child's face, skin tone, age, expression, proportions, and identity.",
      'Only change the hairstyle and related hair silhouette.',
      `Haircut option: ${option.name}.`,
      `Why it suits the child: ${option.reason}`,
      `Style direction: ${(preferences || []).join(', ') || 'advisor choice'}.`,
      `Trim cadence: ${trimCadence || 'not specified'}.`,
      `Styling level: ${stylingLevel || 'not specified'}.`,
      'Keep the haircut age-appropriate for a 3-year-old and salon-feasible.',
      'Photorealistic head-and-shoulders portrait. Do not add accessories or alter facial features.'
    ].join(' '),
    images: photos.map((photo) => photo.dataUrl).filter(Boolean),
  };
}

async function renderOptionImage(option, photos, body, imageModel) {
  const { image, warnings } = await generateImage({
    model: imageModel,
    prompt: buildImagePrompt(option, body.preferences, body.trimCadence, body.stylingLevel, photos),
    aspectRatio: '4:5',
  });

  return {
    ...option,
    imageBase64: image.base64,
    imageMediaType: image.mediaType || 'image/png',
    imageModelUsed: imageModel,
    warnings,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const photos = Array.isArray(body?.photos) ? body.photos : [];
    const analysisModel = normalizeAnalysisModel(body?.analysisModel);
    const imageModel = normalizeImageModel(body?.imageModel);

    if (!photos.length) {
      return Response.json({
        status: 'need_more_input',
        message: 'Add at least one clear photo.',
        missing: ['front photo']
      }, { status: 400 });
    }

    const skill = await readFile(join(process.cwd(), 'skills', 'first-haircut', 'SKILL.md'), 'utf8');
    const content = [
      {
        type: 'text',
        text: `Evaluate these first-haircut references. Photo slots: ${photos.map((photo) => photo.slot).join(', ')}. Preferences: ${(body.preferences || []).join(', ') || 'advisor choice'}. Trim cadence: ${body.trimCadence || 'not specified'}. Styling: ${body.stylingLevel || 'not specified'}.\n\nReturn ONLY valid JSON, no markdown. If visual information is insufficient: {"status":"need_more_input","message":"...","missing":["..."]}. If sufficient: {"status":"ready","message":"...","observations":["..."],"options":[{"name":"...","reason":"..."},{"name":"...","reason":"..."},{"name":"...","reason":"..."},{"name":"...","reason":"..."}]}.`
      },
      ...photos.map((photo) => ({ type: 'image', image: photo.dataUrl }))
    ];

    const { text } = await generateText({
      model: analysisModel,
      system: `${skill}\n\nThe SKILL.md above is authoritative. You are the First Cut product agent.`,
      messages: [{ role: 'user', content }],
    });

    const analysis = parseJson(text);
    if (analysis.status !== 'ready' || !Array.isArray(analysis.options) || !analysis.options.length) {
      return Response.json({ ...analysis, analysisModelUsed: analysisModel });
    }

    const limitedOptions = analysis.options.slice(0, 4);
    const settled = await Promise.allSettled(
      limitedOptions.map((option) => renderOptionImage(option, photos, body, imageModel))
    );

    const options = settled.map((result, index) => result.status === 'fulfilled'
      ? result.value
      : { ...limitedOptions[index], imageError: result.reason?.message || 'Image generation failed for this option.' }
    );

    const failures = options.filter((option) => option.imageError).length;
    return Response.json({
      ...analysis,
      status: failures === options.length ? 'partial_error' : analysis.status,
      message: failures === 0
        ? analysis.message
        : failures < options.length
          ? `${analysis.message} ${failures} preview${failures === 1 ? '' : 's'} could not be rendered.`
          : 'The haircut directions were generated, but the preview images failed to render.',
      analysisModelUsed: analysisModel,
      imageModelUsed: imageModel,
      options,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ status: 'error', message: error?.message || 'Agent failed' }, { status: 500 });
  }
}
