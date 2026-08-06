/** Renders a JSON-LD graph. Server component; never hydrated. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from CMS content, not user input, and JSON.stringify
      // escapes the string contents. `<` is escaped so a stray "</script>" in
      // content cannot break out of the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
