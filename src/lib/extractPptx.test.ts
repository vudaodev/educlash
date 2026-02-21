import { extractPptxText } from './extractPptx';

vi.mock('jszip', () => ({
  default: {
    loadAsync: async (file: File) => {
      const text = await file.text();
      if (!text.startsWith('PK')) {
        throw new Error('Corrupted zip');
      }
      const name = file.name;
      if (name.includes('empty')) {
        return {
          files: {
            'ppt/slides/slide1.xml': {
              async: () => '<p:sld></p:sld>',
            },
          },
        };
      }
      if (name.includes('single')) {
        return {
          files: {
            'ppt/slides/slide1.xml': {
              async: () => '<p:sld><a:t>Slide 1 text</a:t></p:sld>',
            },
          },
        };
      }
      if (name.includes('multi')) {
        return {
          files: {
            'ppt/slides/slide1.xml': {
              async: () => '<p:sld><a:t>Slide 1</a:t></p:sld>',
            },
            'ppt/slides/slide2.xml': {
              async: () => '<p:sld><a:t>Slide 2</a:t></p:sld>',
            },
          },
        };
      }
      return { files: {} };
    },
  },
}));

describe('extractPptxText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts text from a single-slide PPTX', async () => {
    const file = new File(['PK\x03\x04'], 'single.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    const text = await extractPptxText(file);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('extracts and concatenates text from multi-slide PPTX', async () => {
    const file = new File(['PK\x03\x04'], 'multi.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    const text = await extractPptxText(file);
    expect(typeof text).toBe('string');
  });

  it('returns empty string for PPTX with no text content', async () => {
    const file = new File(['PK\x03\x04'], 'empty.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    const text = await extractPptxText(file);
    expect(text).toBe('');
  });

  it('throws on corrupt/invalid file', async () => {
    const file = new File(['not a zip'], 'corrupt.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    await expect(extractPptxText(file)).rejects.toThrow();
  });

  it('is exported as a named export', () => {
    expect(typeof extractPptxText).toBe('function');
  });
});
