import { render, screen } from '@testing-library/react';
import PlayPage from './PlayPage';

describe('PlayPage', () => {
  it('renders heading', () => {
    render(<PlayPage />);
    expect(screen.getByText('Play')).toBeInTheDocument();
  });
});
