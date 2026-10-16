import { describe, it, expect, vi, afterEach } from 'vitest';
import { track } from './analytics';

type WindowWithGtag = Window & { gtag?: (...args: unknown[]) => void };

afterEach(() => {
  delete (window as WindowWithGtag).gtag;
});

describe('track', () => {
  it('does nothing (and does not throw) when gtag is absent', () => {
    delete (window as WindowWithGtag).gtag;
    expect(() => track('package_selected', { plan: 'starter' })).not.toThrow();
  });

  it('forwards the event name and params to gtag', () => {
    const gtag = vi.fn();
    (window as WindowWithGtag).gtag = gtag;
    track('order_request_submitted', { plan: 'business', addon: true });
    expect(gtag).toHaveBeenCalledWith('event', 'order_request_submitted', {
      plan: 'business',
      addon: true,
    });
  });
});
