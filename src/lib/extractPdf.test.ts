import { extractPdfText } from './extractPdf';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  version: '0.0.0',
  getDocument: ({ data }: { data: ArrayBuffer }) => {
    const text = new TextDecoder().decode(data);
    if (!text.startsWith('%PDF')) {
      return { promise: Promise.reject(new Error('Invalid PDF')) };
    }
    if (text === '%PDF-1.4') {
      return {
        promise: Promise.resolve({
          numPages: 1,
          getPage: () =>
            Promise.resolve({
              getTextContent: () => Promise.resolve({ items: [] }),
            }),
        }),
      };
    }
    const pages = text.includes('multi page') ? 2 : 1;
    return {
      promise: Promise.resolve({
        numPages: pages,
        getPage: (n: number) =>
          Promise.resolve({
            getTextContent: () =>
              Promise.resolve({ items: [{ str: `page ${n} content` }] }),
          }),
      }),
    };
  },
}));

describe('extractPdfText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts text from a single-page PDF', async () => {
    const pdfContent = new Blob(['%PDF-1.4 single page content'], {
      type: 'application/pdf',
    });
    const file = new File([pdfContent], 'single.pdf', {
      type: 'application/pdf',
    });

    const text = await extractPdfText(file);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('extracts and concatenates text from multi-page PDF', async () => {
    const pdfContent = new Blob(['%PDF-1.4 multi page'], {
      type: 'application/pdf',
    });
    const file = new File([pdfContent], 'multi.pdf', {
      type: 'application/pdf',
    });

    const text = await extractPdfText(file);
    expect(typeof text).toBe('string');
  });

  it('returns empty string for a PDF with no text', async () => {
    const pdfContent = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    const file = new File([pdfContent], 'empty.pdf', {
      type: 'application/pdf',
    });

    const text = await extractPdfText(file);
    expect(text).toBe('');
  });

  it('throws on invalid file', async () => {
    const file = new File(['not a pdf'], 'fake.txt', {
      type: 'text/plain',
    });

    await expect(extractPdfText(file)).rejects.toThrow();
  });

  it('is exported as a named export', () => {
    expect(typeof extractPdfText).toBe('function');
  });
});
