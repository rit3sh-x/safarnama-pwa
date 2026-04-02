import sharp from "sharp";
import { mkdirSync } from "fs";
import { join } from "path";

const BG_SRC = "src/assets/icon-background.svg";
const TRANSPARENT_SRC = "src/assets/icon-transparent.svg";
const DEST = "public/icons";

const INPUT_PIXEL_LIMIT = 400_000_000;

mkdirSync(DEST, { recursive: true });

const icons: { size: number; name: string; maskable?: boolean }[] = [
    { size: 16, name: "favicon-16.png" },
    { size: 32, name: "favicon-32.png" },
    { size: 48, name: "icon-48.png" },
    { size: 72, name: "icon-72.png" },
    { size: 96, name: "icon-96.png" },
    { size: 128, name: "icon-128.png" },
    { size: 144, name: "icon-144.png" },
    { size: 152, name: "icon-152.png" },
    { size: 192, name: "icon-192.png" },
    { size: 256, name: "icon-256.png" },
    { size: 384, name: "icon-384.png" },
    { size: 512, name: "icon-512.png" },
    { size: 120, name: "apple-touch-icon-120.png" },
    { size: 152, name: "apple-touch-icon-152.png" },
    { size: 167, name: "apple-touch-icon-167.png" },
    { size: 180, name: "apple-touch-icon-180.png" },
    { size: 180, name: "apple-touch-icon.png" },
    { size: 192, name: "icon-maskable-192.png", maskable: true },
    { size: 512, name: "icon-maskable-512.png", maskable: true },
    { size: 512, name: "icon-monochrome.png" },
];

const shortcutIcons: { src: string; name: string }[] = [
    { src: "src/assets/bus.svg", name: "shortcut-trips.png" },
    { src: "src/assets/home.svg", name: "shortcut-dashboard.png" },
    { src: "src/assets/signpost.svg", name: "shortcut-blogs.png" },
];

const bgSource = () => sharp(BG_SRC, { limitInputPixels: INPUT_PIXEL_LIMIT });

for (const icon of icons) {
    await bgSource()
        .resize(icon.size, icon.size)
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(join(DEST, icon.name));

    console.log(`✓ ${icon.name}`);
}

await bgSource()
    .resize(310, 150, { fit: "contain", background: "#00000000" })
    .png()
    .toFile(join(DEST, "icon-wide-310x150.png"));
console.log("✓ icon-wide-310x150.png");

for (const shortcut of shortcutIcons) {
    await sharp(shortcut.src, { limitInputPixels: INPUT_PIXEL_LIMIT })
        .resize(96, 96)
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(join(DEST, shortcut.name));

    console.log(`✓ ${shortcut.name}`);
}

await sharp(TRANSPARENT_SRC, { limitInputPixels: INPUT_PIXEL_LIMIT })
    .resize(512, 512)
    .png()
    .toFile("public/logo.png");
console.log("✓ logo.png");

console.log("\nAll icons generated.");
