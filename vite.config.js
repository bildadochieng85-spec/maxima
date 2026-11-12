import { cp } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "copy-store-images",
      async closeBundle() {
        const root = process.cwd();
        const output = resolve(root, "dist");
        await cp(resolve(root, "img"), resolve(output, "img"), { recursive: true, force: true });
      },
    },
  ],
});
