import { cp, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "copy-static-store-pages",
      async closeBundle() {
        const root = process.cwd();
        const output = resolve(root, "dist");
        const entries = await readdir(root, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isFile() && /\.(html|js|css)$/.test(entry.name) && entry.name !== "index.html") {
            await cp(resolve(root, entry.name), resolve(output, entry.name), { force: true });
          }
        }

        for (const directory of ["img", "css", "webfonts"]) {
          await cp(resolve(root, directory), resolve(output, directory), { recursive: true, force: true });
        }
      },
    },
  ],
});
