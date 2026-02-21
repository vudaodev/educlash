# Skill: new-extractor

Generate a client-side file text extractor.

## Usage

```
/new-extractor <file-type>
```

Example: `/new-extractor pdf`, `/new-extractor pptx`

## Instructions

1. Create a file at `src/lib/extract<FileType>.ts` (e.g., `extractPdf.ts`, `extractPptx.ts`).

2. Follow this pattern:

```typescript
/**
 * Extract text from a <FileType> file in the browser.
 * Heavy dependencies are lazy-loaded to avoid bundle bloat.
 */
export async function extract<FileType>Text(file: File): Promise<string> {
  // Lazy-load the heavy dependency
  const lib = await import('<library>');

  // TODO: extraction logic

  return extractedText;
}
```

3. For **PDF** extraction using `pdfjs-dist`:

```typescript
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n\n');
}
```

4. For **PPTX** extraction using `jszip`:

```typescript
export async function extractPptxText(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default;

  const zip = await JSZip.loadAsync(file);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort();

  const slides: string[] = [];
  for (const slidePath of slideFiles) {
    const xml = await zip.files[slidePath].async('text');
    // Extract text from <a:t> tags in slide XML
    const texts = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)]
      .map((m) => m[1])
      .join(' ');
    slides.push(texts);
  }

  return slides.join('\n\n');
}
```

5. Install the required dependency if not already present:
   - PDF: `npm i pdfjs-dist`
   - PPTX: `npm i jszip`

## Conventions

- **Lazy-load** heavy libraries via dynamic `import()` — PDF.js is ~500KB
- Accept a `File` object (from `<input type="file">` or drag-and-drop)
- Return a single `string` of extracted text
- Extraction runs entirely in the browser — no server round-trip
- The extracted text is stored in `materials.extracted_text` and sent to Gemini via the Edge Function
- Handle errors by letting them propagate — the caller (upload modal) handles UI feedback
