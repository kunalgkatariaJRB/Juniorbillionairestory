import OpenAI from "openai";
import fs from "fs";
import path from "path";

const IS_TEST_MODE = process.env.TEST_MODE === "true";
const MAX_TEST_IMAGES = 2;

/* ===============================
   CHARACTER LOCK
================================ */
const getCharacterProfile = ({ name, age, gender }) => {
  return `
- Human child ONLY (never animal, never fantasy creature)
- ${age}-year-old ${gender === "boy" ? "boy" : "girl"}
- Same face, same hairstyle, same hair color, same eye color, same outfit style in ALL images
- Large expressive eyes, soft skin, smooth hair
- Simple modern children's clothing consistent across ALL pages
- Age-appropriate proportions — round face, soft features
- CONSISTENCY across all pages is MORE important than creativity
`;
};

/* ===============================
   EMOTION BY PAGE
================================ */
const getEmotionForPage = (pageIndex) => {
  if (pageIndex <= 1) return "curious and calm, wide eyes full of wonder";
  if (pageIndex <= 3) return "slightly worried but hopeful, gentle frown with soft eyes";
  if (pageIndex <= 5) return "confused or struggling, eyebrows slightly raised";
  if (pageIndex <= 7) return "determined and trying hard, focused expression";
  if (pageIndex === 8) return "confident and focused, small proud smile";
  if (pageIndex === 9) return "happy and relieved, big bright smile";
  return "peaceful, proud, and joyful — glowing with happiness";
};

/* ===============================
   CAMERA ANGLE BY PAGE
================================ */
const getCameraAngle = (pageIndex) => {
  const angles = [
    "wide establishing shot showing full environment",
    "medium shot, character centered, warm background",
    "close-up on face showing emotion clearly",
    "low angle hero shot making character look brave",
    "over-the-shoulder shot showing character's perspective",
    "wide shot showing character small in a big world",
    "medium close-up, character in action",
    "dynamic diagonal composition, character mid-motion",
    "eye-level medium shot, character looking determined",
    "warm wide shot, character in peaceful environment",
  ];
  return angles[pageIndex] || "medium shot, character centered";
};

/* ===============================
   IMAGE GENERATION
================================ */
export async function generateImages(
  visualScenes,
  pages,
  childProfile,
  bookId,
  options = {}
) {
  const startIndex = options.startIndex || 0;
  const folderPath = path.join("images", bookId);

  fs.mkdirSync(folderPath, { recursive: true });

  const limit = IS_TEST_MODE
    ? Math.min(MAX_TEST_IMAGES, pages.length)
    : pages.length;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log(`🎨 Generating images in Marvel flat vector style...`);

  const imagePaths = [];

  for (let i = 0; i < limit; i++) {
    const pageNumber = String(startIndex + i + 1).padStart(2, "0");
    const imagePath = path.join(folderPath, `page_${pageNumber}.png`);

    // ♻️ REUSE IMAGE IF EXISTS
    if (fs.existsSync(imagePath)) {
      console.log(`♻️ Reusing image page ${pageNumber}`);
      imagePaths.push(imagePath);
      continue;
    }

    // 🧪 EXTRA SAFETY (TEST MODE)
    if (IS_TEST_MODE && i >= MAX_TEST_IMAGES) {
      console.log("🧪 TEST MODE: image generation stopped");
      break;
    }

    const prompt = `
ILLUSTRATION STYLE:
Flat vector children's book illustration with Marvel-inspired energy. Bold clean outlines,
dynamic compositions, soft muted pastels mixed with vivid accent colors, warm cinematic lighting.
Think Marvel storybook art — heroic poses, expressive faces, strong contrast between foreground
and background. No text, no letters, no speech bubbles, no capes unless story mentions them.

CHARACTER (must match EXACTLY across all pages):
${getCharacterProfile(childProfile)}

SCENE TO ILLUSTRATE:
${visualScenes[i]}

STORY CONTEXT (ground truth):
"${pages[i]}"

SETTING RULES:
- Location: must match the story page exactly — no invented locations
- If story mentions school: show classroom or school environment
- If story mentions home: show indoor home setting
- If story mentions outdoors: match that exact outdoor place
- If story mentions forest: show a magical vibrant forest
- If story mentions space: show a pastel outer space scene
- If story mentions water or ocean: show a magical ocean scene
- If story mentions sky or flying: show child in a bright open sky
- Time of day: daytime unless story says otherwise
- NEVER mix locations or replace activities

COMPOSITION:
- Camera: ${getCameraAngle(i)}
- Lighting: Warm cinematic light, directional from upper left, soft shadows
- Mood: ${getEmotionForPage(i)}
- Character expression AND body posture must clearly reflect the mood
- Marvel-inspired dynamic angle where appropriate — avoid flat static poses

BACKGROUND:
- Richly detailed but not cluttered
- Complementary to character — background should never overpower the child
- Use depth: sharp foreground, slightly soft background

OUTPUT: Single illustration only. No borders, no frames, no page numbers, no watermarks.
`;

    // ✅ MODEL AND QUALITY UNCHANGED FROM ORIGINAL
    const result = await openai.images.generate({
      model: "gpt-image-1.5",
      prompt,
      size: "1024x1024",
      quality: "medium",
    });

    fs.writeFileSync(
      imagePath,
      Buffer.from(result.data[0].b64_json, "base64")
    );

    imagePaths.push(imagePath);
    console.log(`🎨 Image generated: page ${pageNumber} [Marvel Flat Vector]`);
  }

  return imagePaths;
}