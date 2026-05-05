import type { NextConfig } from "next";

const config: NextConfig = {
	reactStrictMode: true,
	experimental: {
		optimizePackageImports: ["react-markdown", "rehype-highlight"],
	},
};

export default config;
