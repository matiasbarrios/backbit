import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import {
	bytecodePlugin,
	defineConfig,
	externalizeDepsPlugin,
} from "electron-vite";

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin(), bytecodePlugin()],
	},
	preload: {
		// Don't externalize dependencies in preload for better compatibility with sandbox
		build: {
			rollupOptions: {
				external: ["electron"],
			},
		},
		plugins: [bytecodePlugin()],
	},
	renderer: {
		resolve: {
			alias: {
				"@renderer": resolve("src/renderer"),
			},
		},
		plugins: [react()],
	},
});
