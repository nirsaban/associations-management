import { describe, it, expect, beforeEach, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: (k: string) => Promise.resolve(store.get(k) ?? null),
    setItem: (k: string, v: string) => { store.set(k, v); return Promise.resolve(); },
    removeItem: (k: string) => { store.delete(k); return Promise.resolve(); },
  },
}));

import { listTemplates, saveTemplate, deleteTemplate } from './alert-templates';

beforeEach(() => store.clear());

describe('alert-templates', () => {
  it('starts empty', async () => {
    expect(await listTemplates()).toEqual([]);
  });
  it('saves and lists', async () => {
    await saveTemplate({ name: 'Reminder', title: 'Pay', body: 'Please pay', audience: 'UNPAID_THIS_MONTH' });
    const list = await listTemplates();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: 'Reminder', title: 'Pay' });
    expect(list[0].id).toBeTruthy();
  });
  it('updates by id', async () => {
    const saved = await saveTemplate({ name: 'A', title: 't', body: 'b' });
    await saveTemplate({ id: saved.id, name: 'A2', title: 't', body: 'b' });
    const list = await listTemplates();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('A2');
  });
  it('deletes', async () => {
    const saved = await saveTemplate({ name: 'A', title: 't', body: 'b' });
    await deleteTemplate(saved.id);
    expect(await listTemplates()).toEqual([]);
  });
});
