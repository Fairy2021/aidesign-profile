import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content");
const outputFile = path.join(root, "portfolio-data.js");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const categoryOrder = ["midjourney创作者", "玩家设计师", "系列GIF表情包-学院60周年ip设计"];

async function main() {
  const profile = await readJson(path.join(contentDir, "profile.json"), {
    name: "你的名字",
    eyebrow: "Selected Works",
    intro: "在这里写一句简洁的个人介绍，说明你的创作方向、审美取向或服务内容。",
    footer: "© Portfolio",
    meta: {
      Direction: "视觉设计 / 摄影 / 插画",
      Contact: "your@email.com",
      Location: "China",
    },
  });

  profile.heroImages = await getImages(path.join(contentDir, "个人主页"));

  const entries = await safeReaddir(contentDir, { withFileTypes: true });
  const categoryDirs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_") && entry.name !== "个人主页")
    .sort((a, b) => getCategoryRank(a.name) - getCategoryRank(b.name) || a.name.localeCompare(b.name, "zh-CN"));

  const categories = [];
  const works = [];

  for (const categoryDir of categoryDirs) {
    const categoryName = cleanName(categoryDir.name);
    const categorySlug = slugify(categoryDir.name);
    const categoryPath = path.join(contentDir, categoryDir.name);
    const categoryDescription = await readDescription(categoryPath);

    categories.push({ name: categoryName, slug: categorySlug, description: categoryDescription });

    const categoryEntries = await safeReaddir(categoryPath, { withFileTypes: true });
    const workDirs = categoryEntries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

    for (const workDir of workDirs) {
      const workPath = path.join(categoryPath, workDir.name);
      const images = await getImages(workPath);
      if (!images.length) continue;

      const description = await readDescription(workPath);
      works.push({
        title: cleanName(workDir.name),
        slug: `${categorySlug}-${slugify(workDir.name)}`,
        category: categoryName,
        categorySlug,
        description,
        images,
        cover: await getImageInfo(path.join(root, images[0])),
      });
    }

    const directImages = await getImages(categoryPath);
    for (const [index, image] of directImages.entries()) {
      const parsed = path.parse(image);
      const description = await readText(path.join(root, `${parsed.dir}/${parsed.name}.txt`));
      works.push({
        title: categoryName,
        slug: `${categorySlug}-${slugify(parsed.name)}`,
        category: categoryName,
        categorySlug,
        description,
        images: [image],
        cover: await getImageInfo(path.join(root, image)),
        direct: true,
      });
    }
  }

  const payload = { profile, categories, works };
  await writeFile(
    outputFile,
    `window.PORTFOLIO_DATA = ${JSON.stringify(payload, null, 2)};\n`,
    "utf8",
  );

  console.log(`Generated ${path.relative(root, outputFile)} with ${works.length} works.`);
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function readDescription(dirPath) {
  const candidates = ["info.txt", "description.txt", "简介.txt", "说明.txt"];
  for (const name of candidates) {
    const value = await readText(path.join(dirPath, name));
    if (value) return value;
  }
  return "";
}

async function readText(filePath) {
  try {
    return (await readFile(filePath, "utf8")).trim();
  } catch {
    return "";
  }
}

async function safeReaddir(dirPath, options) {
  try {
    return await readdir(dirPath, options);
  } catch {
    return [];
  }
}

async function getImages(dirPath) {
  const entries = await safeReaddir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
    .map((entry) => toWebPath(path.relative(root, path.join(dirPath, entry.name))));
}

async function getImageInfo(filePath) {
  try {
    const buffer = await readFile(filePath);
    const size = readImageSize(buffer);
    const width = size.width || 1;
    const height = size.height || 1;
    return {
      width,
      height,
      ratio: Number((width / height).toFixed(3)),
      orientation: getOrientation(width, height),
    };
  } catch {
    return { width: 1, height: 1, ratio: 1, orientation: "square" };
  }
}

function readImageSize(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return readJpegSize(buffer);
  if (buffer.toString("ascii", 1, 4) === "PNG") return readPngSize(buffer);
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return readWebpSize(buffer);
  }
  return { width: 1, height: 1 };
}

function readJpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return { width: 1, height: 1 };
}

function readPngSize(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readWebpSize(buffer) {
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  return { width: 1, height: 1 };
}

function getOrientation(width, height) {
  const ratio = width / height;
  if (ratio > 1.25) return "wide";
  if (ratio < 0.82) return "portrait";
  return "square";
}

function cleanName(value) {
  return value
    .replace(/^\d+[-_.\s]*/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function slugify(value) {
  const ascii = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return encodeURIComponent(ascii || "item");
}

function toWebPath(value) {
  return value.split(path.sep).join("/");
}

function getCategoryRank(name) {
  const index = categoryOrder.indexOf(name);
  return index === -1 ? categoryOrder.length : index;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
