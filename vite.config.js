import { defineConfig } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  if (mode === "lib") {
    return {
      build: {
        cssCodeSplit: true,

        lib: {
          entry: path.resolve(__dirname, "src/index.js"),
          name: "Nidam",
          formats: ["es", "umd"],
          fileName: (f) => `nidam.${f}.js`,
        },

        emptyOutDir: true,
      },
    };
  }

  return {
    build: {
      emptyOutDir: false,

      rollupOptions: {
        input: path.resolve(__dirname, "src/styles/styles.css"),
        output: {
          assetFileNames: "nidam.css",
        },
      },
    },
  };
});
