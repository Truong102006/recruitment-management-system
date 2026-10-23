import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './app';
import { AppProviders } from './providers';
import { QueryClient } from '@tanstack/react-query';

describe('App and AppProviders', () => {
  it('renders App with router successfully', () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    expect(screen.getByText('Talento Recruitment Management System')).toBeInTheDocument();
  });

  it('renders AppProviders with custom queryClient', () => {
    const queryClient = new QueryClient();
    render(
      <AppProviders queryClient={queryClient}>
        <div data-testid="custom-child">Child Element</div>
      </AppProviders>,
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });
});
