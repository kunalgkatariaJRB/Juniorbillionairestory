import OpenAI from "openai";
import fs from "fs";
import path from "path";

const IS_TEST_MODE = process.env.TEST_MODE === "true";
const MAX_TEST_IMAGES = 2;

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER PROFILES
// ─────────────────────────────────────────────────────────────────────────────

const getCharacterProfile = ({ name, gender }) => {
  const isBoy =
    gender === "boy" || gender === "male" ||
    gender === "Boy" || gender === "Male";

  if (isBoy) {
    return `
CHARACTER: A small storybook boy named ${name}.
- Face: round and soft, large dark expressive eyes with clean bright highlights,
  tiny nose, gentle smile. Rosy pink cheeks — soft and subtle, not cartoon circles.
- Skin: light warm peachy-cream — clean, smooth, luminous. NOT tan, NOT brown, NOT orange.
  Rendered with smooth clean digital shading — skin looks fresh and glowing, NOT grainy or rough.
- Hair: short dark brown hair, clean smooth shape with soft shine. NOT textured or rough.
- Outfit (SAME EVERY PAGE): soft mint-green or sky-blue long-sleeve top, simple light grey trousers.
  Clean smooth fabric — no rough texture. NEVER changes. NEVER orange. NEVER dark colors.
- FULL BODY — head to feet visible. 30–40% of total image height.
  Standing in environment. NOT cropped. NOT a portrait. NOT a bust shot.
- Rendering: clean smooth digital illustration — luminous, crisp edges, no grain, no rough texture.
`;
  } else {
    return `
CHARACTER: A small storybook girl named ${name}.
- Face: round and soft, large dark expressive eyes with clean bright highlights,
  tiny nose, gentle smile. Rosy pink cheeks — soft and subtle, not cartoon circles.
- Skin: light warm peachy-cream — clean, smooth, luminous. NOT tan, NOT brown, NOT orange.
  Rendered with smooth clean digital shading — skin looks fresh and glowing, NOT grainy or rough.
- Hair: long flowing dark brown hair, loose and gently wavy, soft shine.
  Clean smooth strands with gentle movement. NOT rough or textured.
- Outfit (SAME EVERY PAGE): soft dusty rose-pink dress, A-line, simple and sweet.
  Clean smooth fabric. NEVER changes. NEVER orange. NEVER red. NEVER a princess gown.
- FULL BODY — head to feet visible. 30–40% of total image height.
  Standing in environment. NOT cropped. NOT a portrait. NOT a bust shot.
- Rendering: clean smooth digital illustration — luminous, crisp edges, no grain, no rough texture.
`;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLE ANCHOR — Modern digital children's book, NOT vintage
// ─────────────────────────────────────────────────────────────────────────────

const getStyleAnchor = ({ gender }) => {
  const isBoy =
    gender === "boy" || gender === "male" ||
    gender === "Boy" || gender === "Male";

  return `
ILLUSTRATION STYLE:
Modern premium digital children's book illustration — 2020s style.
Clean, luminous, crisp digital painting. Like top-tier ArtStation or Behance
children's book concept art. Published by major modern publishers (Nosy Crow, Macmillan).

THIS IS DIGITAL ART — clean, smooth, luminous, modern. NOT vintage. NOT old-school.
NOT crayon texture. NOT pencil grain. NOT rough matte surface. NOT 1980s illustration style.

RENDERING:
- Clean smooth digital painting — Procreate or Photoshop digital brush style
- Soft smooth color gradients — no grain, no rough texture, no paper texture
- Characters: smooth clean skin rendering with soft luminous glow
- Colors are CLEAN and VIVID but not neon — fresh, bright, modern
- Crisp soft edges — clean separation between elements, no blurriness, no rough edges
- Smooth soft shadows — gentle and clean, not harsh, not grainy
- Everything looks FRESH, CLEAN, MODERN — like it was illustrated in 2024

ATMOSPHERE & LIGHTING:
- Background: soft cool lavender-blue gradient — smooth, clean, luminous
  Like a clear soft sky at dusk — #B8C4E0 to #D4CCEC — smooth gradient, NOT flat, NOT textured
- Background is open and airy — 50–60% soft gradient sky/atmosphere behind character
- ONE magical warm glowing light element — soft golden or warm white glow with clean bloom
- Smooth volumetric glow — clean, luminous, modern light effect — NOT grainy
- Character warmly and cleanly lit — smooth highlights, luminous skin
- 3–5 soft translucent floating bubbles/orbs — clean, glassy, luminous pastel tones

COLOR PALETTE — clean and modern:
- Background: smooth cool lavender-blue (#B8C4E0 to #D4CCEC) — clean gradient
- Character skin: clean luminous peachy-cream — smooth and fresh
- Outfit: girl = soft dusty pink | boy = clean mint/sky blue — both clean and bright
- Warm glow: golden-white or soft warm pink — one focal light source
- Floating orbs: clean glassy pastel — soft pink, mint, lavender, cream
- Overall: CLEAN, BRIGHT, LUMINOUS — modern digital palette, NOT muted, NOT vintage

COMPOSITION:
- Full body character — 30–40% of image height — head to feet always visible
- Wide open scene — environment surrounds and frames the character
- Open space above — clean gradient sky
- Character lower-center, grounded naturally in scene
- Scene setting rendered cleanly in background — recognizable but not dominant
- Clean simple foreground — a few soft flowers or ground elements, clean and minimal
- NOT a portrait. NOT cropped. FULL BODY in a full scene.

GENDER LOCK:
${isBoy
    ? "BOY — short clean dark hair, fixed mint/sky-blue top + grey trousers. Full body. NEVER long hair. NEVER a dress."
    : "GIRL — long clean flowing dark hair, fixed dusty rose-pink dress. Full body. NEVER short hair. NEVER pants. NEVER orange/red."}

NEGATIVE PROMPT:
vintage illustration, old-school, crayon texture, pencil grain, rough matte surface,
gouache texture, watercolor paper grain, 1970s style, 1980s style, aged illustration,
portrait shot, cropped, bust shot, close-up, chibi, flat cartoon, anime, 3D render,
Pixar style, photorealistic, brown skin, tan skin, orange skin, warm golden background,
orange outfit, red outfit, princess costume, outfit change, harsh shadows, grainy texture,
rough texture, muted dull colors, faded colors, text in image, watermark, logo
`;
};

// ─────────────────────────────────────────────────────────────────────────────
// EMOTION PER PAGE
// ─────────────────────────────────────────────────────────────────────────────

const getEmotionForPage = (i) => {
  if (i <= 1) return "gentle wonder — soft wide eyes gazing upward, peaceful small smile";
  if (i <= 3) return "curious uncertainty — head gently tilted, soft thoughtful expression";
  if (i <= 5) return "delighted surprise — wide bright eyes, soft open smile of wonder";
  if (i <= 7) return "quiet determination — calm steady eyes, small confident smile";
  if (i === 8) return "soft pride — warm gentle smile, bright peaceful eyes";
  if (i === 9) return "pure joy — open smile, eyes bright and crinkled with happiness";
  return "peaceful contentment — soft radiant smile, serene and calm";
};

// ─────────────────────────────────────────────────────────────────────────────
// STORY TEXT CLEANER
// ─────────────────────────────────────────────────────────────────────────────

const cleanPageText = (text) => {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
    .trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

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

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const isBoy =
    childProfile.gender === "boy" || childProfile.gender === "male" ||
    childProfile.gender === "Boy" || childProfile.gender === "Male";

  console.log(
    `🎨 Generating — ${childProfile.name}, ${isBoy ? "BOY" : "GIRL"} — modern digital storybook style`
  );

  const characterProfile = getCharacterProfile(childProfile);
  const styleAnchor = getStyleAnchor(childProfile);
  const imagePaths = [];

  for (let i = 0; i < limit; i++) {
    const pageNumber = String(startIndex + i + 1).padStart(2, "0");
    const imagePath = path.join(folderPath, `page_${pageNumber}.png`);

    if (fs.existsSync(imagePath)) {
      console.log(`♻️  Reusing page ${pageNumber}`);
      imagePaths.push(imagePath);
      continue;
    }

    if (IS_TEST_MODE && i >= MAX_TEST_IMAGES) break;

    const cleanedPageText = cleanPageText(pages[i]);

    const prompt = `
${styleAnchor}

${characterProfile}

EXPRESSION THIS PAGE: ${getEmotionForPage(startIndex + i)}

SCENE:
${visualScenes[i]}

STORY CONTEXT (do NOT render as text in image):
"${cleanedPageText}"

PAGE COMPOSITION REMINDER:
- ${childProfile.name} shown FULL BODY — head to feet — in a wide open scene
- Character is 30–40% of image height — small in frame, environment around them
- Clean smooth cool lavender-blue background sky — open and airy
- One warm clean glowing light source for magic
- Modern clean digital illustration quality — luminous, crisp, fresh — NOT vintage, NOT grainy
`.trim();

    try {
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1536x1024",
        quality: "medium",
        output_format: "png",
      });

      const b64 = result.data[0].b64_json;
      fs.writeFileSync(imagePath, Buffer.from(b64, "base64"));
      imagePaths.push(imagePath);
      console.log(`✅ Page ${pageNumber} saved`);
    } catch (err) {
      console.error(`❌ Page ${pageNumber} failed:`, err.message);
      imagePaths.push(null);
    }
  }

  return imagePaths;
}