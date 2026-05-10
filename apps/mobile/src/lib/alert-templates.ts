import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AlertAudience } from './extra.api';

const KEY = 'alert.templates.v1';

export interface AlertTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  audience?: AlertAudience;
}

export async function listTemplates(): Promise<AlertTemplate[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as AlertTemplate[]; } catch { return []; }
}

export async function saveTemplate(tpl: Omit<AlertTemplate, 'id'> & { id?: string }): Promise<AlertTemplate> {
  const list = await listTemplates();
  const id = tpl.id ?? `t_${Date.now()}`;
  const next: AlertTemplate = { ...tpl, id };
  const idx = list.findIndex((x) => x.id === id);
  if (idx >= 0) list[idx] = next; else list.unshift(next);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  return next;
}

export async function deleteTemplate(id: string): Promise<void> {
  const list = (await listTemplates()).filter((x) => x.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}
