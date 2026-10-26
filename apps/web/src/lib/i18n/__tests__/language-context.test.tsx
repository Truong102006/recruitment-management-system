import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useLanguage } from '../language-context';

function TestConsumer() {
  const { language, setLanguage, toggleLanguage, t } = useLanguage();

  return (
    <div>
      <div data-testid="current-lang">{language}</div>
      <div data-testid="nav-find-jobs">{t('nav.findJobs')}</div>
      <div data-testid="jobs-found-count">{t('jobs.foundCount', { count: 12 })}</div>
      <div data-testid="missing-key">{t('some.unknown.key')}</div>

      <button type="button" onClick={() => setLanguage('en')} data-testid="btn-set-en">
        Set EN
      </button>
      <button type="button" onClick={() => setLanguage('vi')} data-testid="btn-set-vi">
        Set VI
      </button>
      <button type="button" onClick={toggleLanguage} data-testid="btn-toggle">
        Toggle
      </button>
    </div>
  );
}

describe('LanguageContext and i18n system', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to Vietnamese ("vi") when no preference is stored', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('vi');
    expect(screen.getByTestId('nav-find-jobs')).toHaveTextContent('Tìm việc làm');
    expect(screen.getByTestId('jobs-found-count')).toHaveTextContent('Tìm thấy 12 cơ hội việc làm');
    expect(document.documentElement.lang).toBe('vi');
  });

  it('switches to English ("en") and updates translations and document.lang', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    await user.click(screen.getByTestId('btn-set-en'));

    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(screen.getByTestId('nav-find-jobs')).toHaveTextContent('Find Jobs');
    expect(screen.getByTestId('jobs-found-count')).toHaveTextContent('Found 12 job opportunities');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('talento_language')).toBe('en');
  });

  it('toggles language between "vi" and "en"', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('vi');

    // First toggle: vi -> en
    await user.click(screen.getByTestId('btn-toggle'));
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(screen.getByTestId('nav-find-jobs')).toHaveTextContent('Find Jobs');

    // Second toggle: en -> vi
    await user.click(screen.getByTestId('btn-toggle'));
    expect(screen.getByTestId('current-lang')).toHaveTextContent('vi');
    expect(screen.getByTestId('nav-find-jobs')).toHaveTextContent('Tìm việc làm');
  });

  it('restores language from localStorage on initial render', () => {
    localStorage.setItem('talento_language', 'en');

    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(screen.getByTestId('nav-find-jobs')).toHaveTextContent('Find Jobs');
    expect(document.documentElement.lang).toBe('en');
  });

  it('returns keyPath fallback when key is not found in dictionary', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('missing-key')).toHaveTextContent('some.unknown.key');
  });

  it('renders safely outside LanguageProvider with default Vietnamese fallback', () => {
    render(<TestConsumer />);

    expect(screen.getByTestId('current-lang')).toHaveTextContent('vi');
    expect(screen.getByTestId('nav-find-jobs')).toHaveTextContent('Tìm việc làm');
    expect(screen.getByTestId('jobs-found-count')).toHaveTextContent('Tìm thấy 12 cơ hội việc làm');
  });
});
