import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ScoreBadge } from '../ScoreBadge';

describe('ScoreBadge Component', () => {
  it('renders score text correctly', () => {
    render(<ScoreBadge score={100} />);
    expect(screen.getByText('100 XP')).toBeInTheDocument();
  });

  it('renders Elite label for score >= 90', () => {
    render(<ScoreBadge score={95} />);
    expect(screen.getByText(/Elite/)).toBeInTheDocument();
  });

  it('renders Advanced label for score between 75 and 89', () => {
    render(<ScoreBadge score={80} />);
    expect(screen.getByText(/Advanced/)).toBeInTheDocument();
  });

  it('renders At Risk label for score < 50', () => {
    render(<ScoreBadge score={45} />);
    expect(screen.getByText(/At Risk/)).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<ScoreBadge score={95} showLabel={false} />);
    expect(screen.queryByText(/Elite/)).not.toBeInTheDocument();
  });
});
