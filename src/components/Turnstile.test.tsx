import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/de.json';
import { Turnstile } from './Turnstile';

describe('Turnstile widget', () => {
  it('renders nothing when no site key is configured (fail-safe — forms keep working)', () => {
    // NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset in tests. The component still calls useLocale(), so it must be
    // rendered inside a next-intl provider (mirrors SubscribeForm.test.tsx).
    const { container } = render(
      <NextIntlClientProvider
        locale="de"
        messages={messages as unknown as ComponentProps<typeof NextIntlClientProvider>['messages']}
      >
        <Turnstile onToken={vi.fn()} />
      </NextIntlClientProvider>,
    );
    expect(container.firstChild).toBeNull();
  });
});
