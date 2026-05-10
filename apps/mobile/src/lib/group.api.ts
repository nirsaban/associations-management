import { api, unwrap } from './api';

export interface GroupMemberLite {
  userId: string;
  fullName: string;
  paidThisMonth?: boolean;
}

export interface GroupCurrentDistributor {
  userId: string;
  fullName: string;
  phone?: string | null;
}

export interface GroupFamilyLite {
  id: string;
  name: string;
  contactPhone?: string | null;
  address?: string | null;
  childrenMinorCount?: number;
  totalMemberCount?: number;
  notes?: string | null;
}

export interface GroupView {
  group: { id: string; name: string };
  members: GroupMemberLite[];
  currentDistributor: GroupCurrentDistributor | null;
  families: GroupFamilyLite[];
}

export async function getMyGroupView(): Promise<GroupView> {
  const res = await api.get('/me/group-view');
  return unwrap<GroupView>(res.data);
}
