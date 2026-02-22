import '@testing-library/jest-dom/vitest';

// Expose a jest-compatible global so @testing-library/dom detects fake timers
// and uses vi.advanceTimersByTime inside waitFor.
// See: https://github.com/testing-library/dom-testing-library/issues/987
globalThis.jest = {
  ...globalThis.jest,
  advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
} as never;
