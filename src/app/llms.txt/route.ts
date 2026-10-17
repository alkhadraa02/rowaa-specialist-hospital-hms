import { SITE, DEMO_NOTICE } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE.nameEn} (${SITE.nameAr})

> ${DEMO_NOTICE.en}
> ${DEMO_NOTICE.ar}

Fictional specialist hospital: specialties, doctors, three branches, packages, insurance partners, health articles, news, careers and online appointment booking. Arabic is the default language.

## Main pages
- [Specialties](${SITE.url}/specialties)
- [Find a doctor](${SITE.url}/doctors)
- [Book an appointment](${SITE.url}/book)
- [Branches](${SITE.url}/branches)
- [Packages and offers](${SITE.url}/packages)
- [Insurance partners](${SITE.url}/insurance)
- [Health library](${SITE.url}/articles)
- [News](${SITE.url}/news)
- [Careers](${SITE.url}/careers)
- [Visitor guide](${SITE.url}/visitor-guide)
- [Patient rights](${SITE.url}/patient-rights)
- [FAQ](${SITE.url}/faq)
- [Contact](${SITE.url}/contact)
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
