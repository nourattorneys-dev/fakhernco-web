#!/usr/bin/env python3
"""
Turn content/landing/*.md into .docx files for review.

    python3 scripts/export-landing-docx.py

WHY THIS EXISTS RATHER THAN pandoc
----------------------------------
Neither pandoc nor python-docx is installed, and adding a dependency for a
review artefact is not worth it. A .docx is a zip of XML parts, and the subset
needed here — headings, paragraphs, bullets and bold — is small enough to emit
directly. zipfile is in the standard library, so this runs anywhere.

THE MARKDOWN IS THE SOURCE OF TRUTH
-----------------------------------
The same files render at /lp/<slug> on the site. Editing the .docx changes
nothing; edit the .md and re-run this. That is deliberate — it is the only way
the document under review and the page that goes live cannot drift apart.
"""

import os
import re
import zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "content", "landing")
OUT = os.path.join(SRC, "docx")

W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>"""

RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

DOC_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>"""


def style(sid, name, size_half_pt, bold, before, after, colour="141414", outline=None):
    """One paragraph style. Sizes are half-points, spacing is twentieths of a point."""
    ol = f'<w:outlineLvl w:val="{outline}"/>' if outline is not None else ""
    return (
        f'<w:style w:type="paragraph" w:styleId="{sid}">'
        f'<w:name w:val="{name}"/>'
        f"<w:pPr><w:spacing w:before=\"{before}\" w:after=\"{after}\"/>{ol}</w:pPr>"
        f'<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>'
        f'<w:b w:val="{"1" if bold else "0"}"/>'
        f'<w:color w:val="{colour}"/><w:sz w:val="{size_half_pt}"/></w:rPr>'
        f"</w:style>"
    )


STYLES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    f"<w:styles {W}>"
    + style("Normal", "Normal", 22, False, 0, 140)
    + style("Title", "Title", 40, True, 0, 120)
    + style("Subtitle", "Subtitle", 26, False, 0, 260, colour="545454")
    + style("Heading1", "heading 1", 30, True, 320, 140, outline=0)
    + style("Heading2", "heading 2", 25, True, 260, 120, outline=1)
    + style("ListParagraph", "List Paragraph", 22, False, 0, 80)
    + style("Meta", "Meta", 18, False, 0, 60, colour="7d7d7d")
    + "</w:styles>"
)

# A single bullet list definition, and a single numbered one.
NUMBERING = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    f"<w:numbering {W}>"
    '<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0">'
    '<w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/>'
    '<w:pPr><w:ind w:left="454" w:hanging="227"/></w:pPr>'
    '<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr></w:lvl></w:abstractNum>'
    '<w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/>'
    '<w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/>'
    '<w:pPr><w:ind w:left="454" w:hanging="227"/></w:pPr></w:lvl></w:abstractNum>'
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>'
    '<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>'
    "</w:numbering>"
)


def runs(text):
    """Inline markdown -> runs. Handles **bold**; everything else is literal."""
    out = []
    for i, part in enumerate(re.split(r"\*\*(.+?)\*\*", text, flags=re.S)):
        if not part:
            continue
        bold = i % 2 == 1
        body = escape(re.sub(r"\s+", " ", part))
        rpr = "<w:rPr><w:b/></w:rPr>" if bold else ""
        out.append(f'<w:r>{rpr}<w:t xml:space="preserve">{body}</w:t></w:r>')
    return "".join(out) or '<w:r><w:t/></w:r>'


def para(text, sid="Normal", num=None):
    npr = (
        f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{num}"/></w:numPr>' if num else ""
    )
    return f'<w:p><w:pPr><w:pStyle w:val="{sid}"/>{npr}</w:pPr>{runs(text)}</w:p>'


def parse(md):
    """Split frontmatter from body."""
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", md, re.S)
    if not m:
        return {}, md
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, m.group(2)


def build(meta, body, slug):
    p = []
    p.append(para(meta.get("h1", meta.get("title", slug)), "Title"))
    if meta.get("subhead"):
        p.append(para(meta["subhead"], "Subtitle"))
    p.append(para(f"Landing page  ·  /lp/{slug}  ·  not indexed by search engines", "Meta"))
    if meta.get("description"):
        p.append(para(f"Meta description: {meta['description']}", "Meta"))

    """
    The source is hard-wrapped, so a single newline inside a paragraph or a
    bullet is a soft wrap and has to be joined back. Getting this wrong split
    every wrapped bullet across two lines in the document, with the tail
    escaping the bullet entirely.

    So blocks are accumulated and only flushed when the NEXT block starts or a
    blank line ends them — rather than emitted line by line.
    """
    block = None          # ('para' | 'bullet' | 'number' | 'h1' | 'h2', [lines])

    def flush():
        nonlocal block
        if not block:
            return
        kind, lines = block
        text = " ".join(lines)
        if kind == "h1":
            p.append(para(text, "Heading1"))
        elif kind == "h2":
            p.append(para(text, "Heading2"))
        elif kind == "bullet":
            p.append(para(text, "ListParagraph", num=1))
        elif kind == "number":
            p.append(para(text, "ListParagraph", num=2))
        else:
            p.append(para(text))
        block = None

    for raw in body.splitlines():
        line = raw.rstrip()
        if not line.strip():
            flush()
            continue
        if line.startswith("## "):
            flush(); block = ("h1", [line[3:].strip()])
        elif line.startswith("### "):
            flush(); block = ("h2", [line[4:].strip()])
        elif re.match(r"^\s*[-*]\s+", line):
            flush(); block = ("bullet", [re.sub(r"^\s*[-*]\s+", "", line)])
        elif re.match(r"^\s*\d+\.\s+", line):
            flush(); block = ("number", [re.sub(r"^\s*\d+\.\s+", "", line)])
        elif block:
            block[1].append(line.strip())      # soft-wrapped continuation
        else:
            block = ("para", [line.strip()])
    flush()

    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f"<w:document {W}><w:body>" + "".join(p) +
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>'
        "</w:body></w:document>"
    )


def main():
    os.makedirs(OUT, exist_ok=True)
    files = sorted(f for f in os.listdir(SRC) if f.endswith(".md"))
    if not files:
        raise SystemExit(f"no .md files in {SRC}")

    for f in files:
        slug = f[:-3]
        meta, body = parse(open(os.path.join(SRC, f), encoding="utf-8").read())
        doc = build(meta, body, slug)
        path = os.path.join(OUT, f"{slug}.docx")
        # ZIP_DEFLATED and a fixed date so re-running does not churn the file.
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
            for name, data in (
                ("[Content_Types].xml", CONTENT_TYPES),
                ("_rels/.rels", RELS),
                ("word/_rels/document.xml.rels", DOC_RELS),
                ("word/styles.xml", STYLES),
                ("word/numbering.xml", NUMBERING),
                ("word/document.xml", doc),
            ):
                info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(info, data)
        words = len(re.sub(r"<[^>]+>", " ", doc).split())
        print(f"  {slug}.docx  ({words} words)")

    print(f"\n{len(files)} file(s) -> {OUT}")


if __name__ == "__main__":
    main()
