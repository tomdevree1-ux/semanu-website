/**
 * Renders a JSON-LD <script> for structured data (SEO + GEO). Server component.
 * Pass a single schema object or an array of them.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
