import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { StatusBadge, statusTokenFor } from './StatusBadge';
import { auditLabel, auditColor } from '@/lib/audit/display';

describe('StatusBadge — project', () => {
  it('maps project statuses to the right tokens', () => {
    expect(statusTokenFor('project', 'draft')).toBe('draft');
    expect(statusTokenFor('project', 'active')).toBe('done');
    expect(statusTokenFor('project', 'on_hold')).toBe('waiting');
    expect(statusTokenFor('project', 'completed')).toBe('done');
    expect(statusTokenFor('project', 'cancelled')).toBe('cancelled');
    expect(statusTokenFor('project', 'archived')).toBe('cancelled');
  });
  it('renders a Title-case label (on_hold → On Hold)', () => {
    render(<StatusBadge entityType="project" status="on_hold" />);
    expect(screen.getByText('On Hold')).toBeTruthy();
  });
});

describe('audit display — project events', () => {
  it('labels and colours project events', () => {
    expect(auditLabel('project.created')).toBe('Project created');
    expect(auditLabel('project.archived')).toBe('Project archived');
    expect(auditColor('project.archived')).toBe('revoked');
    expect(auditColor('project.created')).toBe('done');
    expect(auditColor('project.status_changed')).toBe('warning');
  });
});

describe('project client components never import the service-role client', () => {
  const clientFiles = [
    'src/components/portal/projects/ProjectForm.tsx',
    'src/components/portal/projects/ProjectDetailActions.tsx',
  ];
  for (const f of clientFiles) {
    it(`${f} is a client component with no admin/service-role import`, () => {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/supabase\/admin|createAdminClient|service_role|SERVICE_ROLE/);
    });
  }
});
