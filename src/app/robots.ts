// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/pen', '/settings', '/billing', '/api'],
      },
    ],
    sitemap: 'https://quark.dev/sitemap.xml',
  }
}
