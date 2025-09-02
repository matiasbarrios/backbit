import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import {
	defineConfig,
	externalizeDepsPlugin,
} from "electron-vite";

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()],
	},
	preload: {
		// Don't externalize dependencies in preload for better compatibility with sandbox
		build: {
			rollupOptions: {
				external: ["electron"],
			},
		},
		plugins: [],
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
