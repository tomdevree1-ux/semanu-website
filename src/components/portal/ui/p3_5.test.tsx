import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StatusBadge, statusTokenFor, statusLabel } from './StatusBadge';
import { EditableBlock } from './EditableBlock';
import { AvatarUpload } from '@/components/portal/profile/AvatarUpload';

describe('CP4 StatusBadge mapping', () => {
  it('maps user statuses to the right tokens; unknown → system', () => {
    expect(statusTokenFor('user', 'active')).toBe('done');
    expect(statusTokenFor('user', 'invited')).toBe('waiting');
    expect(statusTokenFor('user', 'disabled')).toBe('revoked');
    expect(statusTokenFor('user', 'archived')).toBe('cancelled'); // future-ready UI only
    expect(statusTokenFor('user', 'weird')).toBe('system');
    expect(statusTokenFor('document', 'paid')).toBe('system'); // entity not mapped yet
  });
  it('labels are Title-case and de-dashed', () => {
    expect(statusLabel('active')).toBe('Active');
    expect(statusLabel('past_due')).toBe('Past Due');
    expect(statusLabel('on-hold')).toBe('On Hold');
  });
  it('renders the label text', () => {
    render(<StatusBadge entityType="user" status="invited" />);
    expect(screen.getByText('Invited')).toBeTruthy();
  });
});

describe('CP2 EditableBlock lock/unlock', () => {
  it('starts read-only, unlocks with the pencil, returns to read-only on success', async () => {
    const action = vi.fn(async () => ({ ok: true }));
    render(
      <EditableBlock
        title="Name"
        action={action}
        readView={<span>read-only view</span>}
        editView={(pending) => <input aria-label="First name" name="first_name" defaultValue="Tom" disabled={pending} />}
      />,
    );
    // read-only by default: pencil present, no Save, no input
    expect(screen.getByLabelText('Edit Name')).toBeTruthy();
    expect(screen.queryByText('Save changes')).toBeNull();
    expect(screen.queryByLabelText('First name')).toBeNull();

    // unlock
    fireEvent.click(screen.getByLabelText('Edit Name'));
    expect(screen.getByLabelText('First name')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.queryByLabelText('Edit Name')).toBeNull(); // pencil hidden while editing

    // save → action called → back to read-only + pencil returns
    fireEvent.click(screen.getByText('Save changes'));
    await waitFor(() => expect(action).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByLabelText('Edit Name')).toBeTruthy());
    expect(screen.queryByText('Save changes')).toBeNull();
  });

  it('moves focus to the first field when unlocked', () => {
    render(
      <EditableBlock
        title="Name"
        action={vi.fn(async () => ({ ok: true }))}
        readView={<span>read</span>}
        editView={() => <input aria-label="First name" name="first_name" defaultValue="Tom" />}
      />,
    );
    fireEvent.click(screen.getByLabelText('Edit Name'));
    expect(document.activeElement).toBe(screen.getByLabelText('First name'));
  });

  it('keeps edit mode and shows the error on failure', async () => {
    const action = vi.fn(async () => ({ error: 'Nope' }));
    render(
      <EditableBlock
        title="Name"
        action={action}
        readView={<span>read</span>}
        editView={() => <input aria-label="First name" name="first_name" defaultValue="Tom" />}
      />,
    );
    fireEvent.click(screen.getByLabelText('Edit Name'));
    fireEvent.click(screen.getByText('Save changes'));
    await waitFor(() => expect(screen.getByText('Nope')).toBeTruthy());
    expect(screen.getByText('Save changes')).toBeTruthy(); // still editing
    expect(screen.getByLabelText('First name')).toBeTruthy();
  });

  it('Cancel with a dirty field asks for confirmation', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <EditableBlock
        title="Name"
        action={vi.fn(async () => ({ ok: true }))}
        readView={<span>read</span>}
        editView={() => <input aria-label="First name" name="first_name" defaultValue="Tom" />}
      />,
    );
    fireEvent.click(screen.getByLabelText('Edit Name'));
    fireEvent.input(screen.getByLabelText('First name'), { target: { value: 'Tommy' } });
    fireEvent.click(screen.getByText('Cancel'));
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});

describe('CP3 AvatarUpload auto-upload', () => {
  beforeEach(() => {
    // jsdom has no URL.createObjectURL/revokeObjectURL — define them as mocks.
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(() => 'blob:mock');
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();
    vi.spyOn(HTMLFormElement.prototype, 'requestSubmit').mockImplementation(() => {});
  });
  afterEach(() => {
    // Leave the URL mocks assigned (harmless) so RTL's unmount cleanup — which
    // revokes the object URL — still finds the function.
    vi.restoreAllMocks();
  });

  it('has no Upload button and auto-submits on file select', () => {
    render(<AvatarUpload avatarUrl={null} name="Tom" initialLetter="T" hasAvatar={false} />);
    // The explicit "Upload" button is gone; the picker is a "Choose a photo" label.
    expect(screen.queryByRole('button', { name: /^upload$/i })).toBeNull();
    expect(screen.getByText('Choose a photo')).toBeTruthy();

    const file = new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' });
    const input = document.getElementById('avatar-file') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(URL.createObjectURL).toHaveBeenCalled(); // optimistic preview
    expect(HTMLFormElement.prototype.requestSubmit).toHaveBeenCalled(); // auto-upload
  });

  it('revokes the object URL on unmount', () => {
    const { unmount } = render(<AvatarUpload avatarUrl={null} name="Tom" initialLetter="T" hasAvatar={false} />);
    const file = new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' });
    const input = document.getElementById('avatar-file') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('keeps the Remove photo action when an avatar exists', () => {
    render(<AvatarUpload avatarUrl="https://x/y" name="Tom" initialLetter="T" hasAvatar />);
    expect(screen.getByRole('button', { name: /remove photo/i })).toBeTruthy();
  });
});

describe('CP1 clickable rows (UserTable source structure)', () => {
  const src = readFileSync(join(process.cwd(), 'src/components/portal/users/UserTable.tsx'), 'utf8');
  it('uses the stretched-link pattern + aria-label and drops the View-only target', () => {
    expect(src).toContain('aria-label={`Open ${name}`}');
    expect(src).toContain('stretchedLinkClass');
    expect(src).toContain('clickableRowClass');
    // No standalone "View" link as the primary (only) target anymore.
    expect(src).not.toContain('>View<');
  });
});
