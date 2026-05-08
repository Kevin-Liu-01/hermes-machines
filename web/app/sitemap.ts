import type { MetadataRoute } from "next";

import { SITE } from "@/lib/seo/config";

/**
 * Sitemap for crawlers + AI engines. Public marketing surfaces only --
 * the dashboard tree is gated by Clerk and shouldn't appear in any
 * index. Each entry uses an explicit `lastModified` so search engines
 * have a freshness signal beyond the build timestamp.
 *
 * The landing page anchors (#capabilities / #runtime / #loadout / ...)
 * aren't separate URLs but we surface them as alternates of `/` via
 * the WebSite + BreadcrumbList JSON-LD instead.
 */

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();
	return [
		{
			url: SITE.url,
			lastModified: now,
			changeFrequency: "daily",
			priority: 1.0,
		},
		{
			url: `${SITE.url}/sign-in`,
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.4,
		},
		{
			url: `${SITE.url}/onboarding`,
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${SITE.url}/faq`,
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${SITE.url}/terms`,
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${SITE.url}/privacy`,
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.3,
		},
	];
}
