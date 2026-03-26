import { createServer } from "@cmcrobotics/aframe-watcher-bun";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

// Embed project files
// @ts-ignore
import assetsFurniture from "./assets-furniture.html" with { type: "text" };
// @ts-ignore
import assetsTreats from "./assets-treats.html" with { type: "text" };
// @ts-ignore
import assetsWinter from "./assets-winter.html" with { type: "text" };
// @ts-ignore
import indexHtml from "./index.html" with { type: "text" };
// @ts-ignore
import sceneHtml from "./scene.html" with { type: "text" };

// Embed A-Frame and Patched Inspector
// @ts-ignore
import aframeMin from "./node_modules/aframe/dist/aframe-master.min.js" with { type: "text" };
// @ts-ignore
import aframeInspector from "../vendor/aframe-inspector.min.js" with { type: "text" };

// Embed Components
// @ts-ignore
import arUtils from "./components/ar-utils.js" with { type: "text" };
// @ts-ignore
import linearAnimation from "./components/linear-animation.js" with { type: "text" };
// @ts-ignore
import loadFragment from "./components/load-fragment.js" with { type: "text" };

const embeddedFiles: Record<string, string> = {
  "assets-furniture.html": assetsFurniture,
  "assets-treats.html": assetsTreats,
  "assets-winter.html": assetsWinter,
  "index.html": indexHtml,
  "scene.html": sceneHtml,
  "components/ar-utils.js": arUtils,
  "components/linear-animation.js": linearAnimation,
  "components/load-fragment.js": loadFragment,
};

// Check if files exist on disk, if not, extract them from the binary
for (const [filename, content] of Object.entries(embeddedFiles)) {
  if (!existsSync(filename)) {
    console.log(`Extracting ${filename} to disk...`);
    try {
      const dir = dirname(filename);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(filename, content);
    } catch (err) {
      console.error(`Failed to extract ${filename}:`, err);
    }
  }
}

const watcherPort = 51234;
const staticPort = 3000;

// Start the A-Frame Watcher server (handles /save)
createServer({
  port: watcherPort,
  filePatterns: ["index.html", "scene.html"],
});

// Start a simple static file server for the project
Bun.serve({
  port: staticPort,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    
    // Serve embedded A-Frame
    if (path === "/aframe.min.js") {
      return new Response(aframeMin as any, {
        headers: { "Content-Type": "application/javascript" }
      });
    }

    // Serve embedded A-Frame Inspector
    if (path === "/aframe-inspector.min.js") {
      return new Response(aframeInspector as any, {
        headers: { "Content-Type": "application/javascript" }
      });
    }

    if (path === "/") path = "/index.html";
    
    const filename = path.startsWith("/") ? path.slice(1) : path;
    const file = Bun.file(filename);
    if (await file.exists()) {
      return new Response(file);
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Watching on port ${watcherPort}`);
console.log(`Project available at http://localhost:${staticPort}`);
