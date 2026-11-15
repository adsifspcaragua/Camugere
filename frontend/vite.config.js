import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  ...(mode === "test" && { esbuild: { jsx: "automatic" } }),
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    // Relativo à raiz: ignora as cópias do Stryker sem afetar os testes dentro do próprio sandbox.
    exclude: ["**/node_modules/**", "**/dist/**", ".stryker-tmp/**"],
    coverage: {
      exclude: ["coverage/**", "dist/**", "reports/**", ".stryker-tmp/**", "**/*.config.js", "src/__tests__/**"],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
}))
