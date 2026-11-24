import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  canJoinDuoGarden,
  canSendDailyNudge,
  generateInviteCode,
  isValidInviteCode,
  normalizeInviteCode,
  type DuoGarden,
  type DuoMember,
  type DuoPlacement,
  type SunlightNudge,
} from '@/domain/duo';
import { isWithinGrid } from '@/domain/grid';
import {
  supabase,
  type DewDuoGardenRow,
  type DewDuoMemberRow,
  type DewDuoPlacementRow,
  type DewSunlightNudgeRow,
} from './supabase';

export const DUO_STORAGE_KEY = 'dew-bloom-duo-garden-v1';
const LOCAL_USER_ID = 'local-keeper';
const DEFAULT_GARDEN_NAME = 'Shared Sunlit Meadow';
const DEFAULT_NUDGE_MESSAGE = "Warm sunlight sent to your partner's meadow";

export type DuoActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function getTodayDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function readLocalDuoGarden(): Promise<DuoGarden | null> {
  try {
    const raw = await AsyncStorage.getItem(DUO_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as DuoGarden;
  } catch {
    return null;
  }
}

async function writeLocalDuoGarden(garden: DuoGarden | null): Promise<void> {
  try {
    if (!garden) {
      await AsyncStorage.removeItem(DUO_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(DUO_STORAGE_KEY, JSON.stringify(garden));
  } catch {
    // Ignore storage write errors in restricted environments.
  }
}

async function getAuthenticatedUserId(): Promise<string | null> {
  if (!supabase) {
    return null;
  }
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  } catch {
    return null;
  }
}

function mapMemberRow(row: DewDuoMemberRow): DuoMember {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

function mapPlacementRow(row: DewDuoPlacementRow): DuoPlacement {
  return {
    id: row.id,
    itemId: row.item_id,
    x: row.grid_x,
    y: row.grid_y,
    placedAt: row.placed_at,
    placedBy: row.placed_by,
  };
}

function mapNudgeRow(row: DewSunlightNudgeRow): SunlightNudge {
  return {
    id: row.id,
    gardenId: row.garden_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    nudgeDate: row.nudge_date,
    message: row.message,
    createdAt: row.created_at,
  };
}

async function fetchRemoteGardenById(
  gardenRow: DewDuoGardenRow,
  userId: string,
): Promise<DuoGarden> {
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }

  const [membersRes, placementsRes, nudgesRes] = await Promise.all([
    supabase
      .from('dew_duo_members')
      .select('garden_id, user_id, display_name, role, joined_at')
      .eq('garden_id', gardenRow.id)
      .order('joined_at', { ascending: true }),
    supabase
      .from('dew_duo_placements')
      .select('id, garden_id, placed_by, item_id, grid_x, grid_y, placed_at')
      .eq('garden_id', gardenRow.id)
      .order('placed_at', { ascending: true }),
    supabase
      .from('dew_sunlight_nudges')
      .select('id, garden_id, sender_id, recipient_id, nudge_date, message, created_at')
      .eq('garden_id', gardenRow.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const members = (membersRes.data ?? []).map(mapMemberRow);
  const placements = (placementsRes.data ?? []).map(mapPlacementRow);
  const nudges = (nudgesRes.data ?? []).map(mapNudgeRow);

  const lastSent = nudges.find((n) => n.senderId === userId) ?? null;
  const lastReceived = nudges.find((n) => n.recipientId === userId) ?? null;

  return {
    id: gardenRow.id,
    name: gardenRow.name,
    inviteCode: gardenRow.invite_code,
    biomeId: gardenRow.biome_id,
    createdBy: gardenRow.created_by,
    createdAt: gardenRow.created_at,
    members,
    placements,
    lastNudgeSentDateKey: lastSent ? lastSent.nudgeDate : null,
    lastNudgeReceived: lastReceived,
  };
}

export async function getMyDuoGarden(): Promise<DuoGarden | null> {
  const localGarden = await readLocalDuoGarden();
  const userId = await getAuthenticatedUserId();

  if (!supabase || !userId) {
    return localGarden;
  }

  try {
    const { data: membership, error: memberError } = await supabase
      .from('dew_duo_members')
      .select('garden_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (memberError || !membership) {
      return localGarden;
    }

    const { data: gardenRow, error: gardenError } = await supabase
      .from('dew_duo_gardens')
      .select('id, name, invite_code, biome_id, created_by, created_at')
      .eq('id', membership.garden_id)
      .maybeSingle();

    if (gardenError || !gardenRow) {
      return localGarden;
    }

    const remoteGarden = await fetchRemoteGardenById(gardenRow, userId);
    await writeLocalDuoGarden(remoteGarden);
    return remoteGarden;
  } catch {
    return localGarden;
  }
}

export async function createDuoGarden(params?: {
  name?: string;
  displayName?: string;
}): Promise<DuoActionResult<DuoGarden>> {
  const gardenName = params?.name?.trim() || DEFAULT_GARDEN_NAME;
  const displayName = params?.displayName?.trim() || 'You';
  const inviteCode = generateInviteCode();
  const nowIso = new Date().toISOString();
  const userId = await getAuthenticatedUserId();

  if (supabase && userId) {
    try {
      const { data: createdRow, error: createError } = await supabase
        .from('dew_duo_gardens')
        .insert({
          name: gardenName,
          invite_code: inviteCode,
          biome_id: 'sunlit_meadow',
          created_by: userId,
        })
        .select('id, name, invite_code, biome_id, created_by, created_at')
        .single();

      if (!createError && createdRow) {
        const { error: memberError } = await supabase
          .from('dew_duo_members')
          .insert({
            garden_id: createdRow.id,
            user_id: userId,
            display_name: displayName,
            role: 'owner',
          });

        if (!memberError) {
          const remoteGarden = await fetchRemoteGardenById(createdRow, userId);
          await writeLocalDuoGarden(remoteGarden);
          return { ok: true, data: remoteGarden };
        }
      }
    } catch {
      // Fall back to local offline-first garden creation.
    }
  }

  const localGarden: DuoGarden = {
    id: `local_duo_${Date.now()}`,
    name: gardenName,
    inviteCode,
    biomeId: 'sunlit_meadow',
    createdBy: userId ?? LOCAL_USER_ID,
    createdAt: nowIso,
    members: [
      {
        userId: userId ?? LOCAL_USER_ID,
        displayName,
        role: 'owner',
        joinedAt: nowIso,
      },
    ],
    placements: [],
    lastNudgeSentDateKey: null,
    lastNudgeReceived: null,
  };

  await writeLocalDuoGarden(localGarden);
  return { ok: true, data: localGarden };
}

export async function joinDuoGarden(params: {
  inviteCode: string;
  displayName?: string;
}): Promise<DuoActionResult<DuoGarden>> {
  const normalizedCode = normalizeInviteCode(params.inviteCode);
  if (!isValidInviteCode(normalizedCode)) {
    return {
      ok: false,
      error: 'Enter a valid 6-character invite code.',
    };
  }

  const displayName = params.displayName?.trim() || 'You';
  const userId = await getAuthenticatedUserId();

  if (supabase && userId) {
    try {
      const { data: joinedRow, error: rpcError } = await supabase.rpc(
        'dew_join_duo_garden',
        {
          p_invite_code: normalizedCode,
          p_display_name: displayName,
        },
      );

      if (rpcError) {
        return {
          ok: false,
          error: rpcError.message || 'Unable to join shared meadow with that code.',
        };
      }

      if (joinedRow) {
        const remoteGarden = await fetchRemoteGardenById(joinedRow, userId);
        await writeLocalDuoGarden(remoteGarden);
        return { ok: true, data: remoteGarden };
      }
    } catch {
      return {
        ok: false,
        error: 'Could not reach the shared meadow right now. Please try again.',
      };
    }
  }

  const existing = await readLocalDuoGarden();
  if (existing && existing.inviteCode === normalizedCode) {
    if (!canJoinDuoGarden(existing.members.length)) {
      return {
        ok: false,
        error: 'This shared meadow already has two keepers.',
      };
    }
    const nowIso = new Date().toISOString();
    const updated: DuoGarden = {
      ...existing,
      members: [
        ...existing.members,
        {
          userId: 'local-partner',
          displayName: 'Partner',
          role: 'partner',
          joinedAt: nowIso,
        },
      ],
    };
    await writeLocalDuoGarden(updated);
    return { ok: true, data: updated };
  }

  const nowIso = new Date().toISOString();
  const previewGarden: DuoGarden = {
    id: `local_duo_${normalizedCode}`,
    name: DEFAULT_GARDEN_NAME,
    inviteCode: normalizedCode,
    biomeId: 'sunlit_meadow',
    createdBy: 'local-partner',
    createdAt: nowIso,
    members: [
      {
        userId: 'local-partner',
        displayName: 'Partner',
        role: 'owner',
        joinedAt: nowIso,
      },
      {
        userId: userId ?? LOCAL_USER_ID,
        displayName,
        role: 'partner',
        joinedAt: nowIso,
      },
    ],
    placements: [
      {
        id: `duo_seed_${normalizedCode}_1`,
        itemId: 'lavender',
        x: 3,
        y: 3,
        placedAt: nowIso,
        placedBy: 'local-partner',
      },
    ],
    lastNudgeSentDateKey: null,
    lastNudgeReceived: null,
  };

  await writeLocalDuoGarden(previewGarden);
  return { ok: true, data: previewGarden };
}

export async function sendSunlightNudge(
  gardenId: string,
  message: string = DEFAULT_NUDGE_MESSAGE,
): Promise<DuoActionResult<{ garden: DuoGarden; nudge: SunlightNudge }>> {
  const garden = await readLocalDuoGarden();
  if (!garden || garden.id !== gardenId) {
    return {
      ok: false,
      error: 'Create or join a shared meadow first.',
    };
  }

  const todayKey = getTodayDateKey();
  if (!canSendDailyNudge(garden.lastNudgeSentDateKey, todayKey)) {
    return {
      ok: false,
      error: 'Warm sunlight has already been sent today.',
    };
  }

  const userId = (await getAuthenticatedUserId()) ?? LOCAL_USER_ID;
  const recipient =
    garden.members.find((m) => m.userId !== userId) ?? garden.members[0];
  const recipientId = recipient?.userId ?? 'local-partner';
  const nowIso = new Date().toISOString();

  const nudge: SunlightNudge = {
    id: `nudge_${Date.now()}`,
    gardenId: garden.id,
    senderId: userId,
    recipientId,
    nudgeDate: todayKey,
    message,
    createdAt: nowIso,
  };

  if (supabase && userId !== LOCAL_USER_ID && recipient && recipient.userId !== userId) {
    try {
      await supabase.from('dew_sunlight_nudges').insert({
        garden_id: garden.id,
        sender_id: userId,
        recipient_id: recipient.userId,
        nudge_date: todayKey,
        message,
      });
    } catch {
      // Keep local optimistic update even if offline.
    }
  }

  const updatedGarden: DuoGarden = {
    ...garden,
    lastNudgeSentDateKey: todayKey,
  };

  await writeLocalDuoGarden(updatedGarden);
  return { ok: true, data: { garden: updatedGarden, nudge } };
}

export async function placeDuoItem(params: {
  gardenId: string;
  itemId: string;
  x: number;
  y: number;
}): Promise<DuoActionResult<DuoGarden>> {
  const { gardenId, itemId, x, y } = params;
  const garden = await readLocalDuoGarden();
  if (!garden || garden.id !== gardenId) {
    return {
      ok: false,
      error: 'Create or join a shared meadow first.',
    };
  }

  if (!isWithinGrid(x, y)) {
    return {
      ok: false,
      error: 'Tap a tile inside the 8x8 meadow.',
    };
  }

  if (garden.placements.some((p) => p.x === x && p.y === y)) {
    return {
      ok: false,
      error: 'That patch already holds something. Tap an open tile.',
    };
  }

  const userId = (await getAuthenticatedUserId()) ?? LOCAL_USER_ID;
  const nowIso = new Date().toISOString();

  let newPlacement: DuoPlacement = {
    id: `duo_placement_${itemId}_${x}_${y}_${Date.now()}`,
    itemId,
    x,
    y,
    placedAt: nowIso,
    placedBy: userId,
  };

  if (supabase && userId !== LOCAL_USER_ID) {
    try {
      const { data: inserted, error } = await supabase
        .from('dew_duo_placements')
        .insert({
          garden_id: garden.id,
          placed_by: userId,
          item_id: itemId,
          grid_x: x,
          grid_y: y,
        })
        .select('id, garden_id, placed_by, item_id, grid_x, grid_y, placed_at')
        .single();

      if (!error && inserted) {
        newPlacement = mapPlacementRow(inserted);
      }
    } catch {
      // Fall back to local placement when offline.
    }
  }

  const updatedGarden: DuoGarden = {
    ...garden,
    placements: [...garden.placements, newPlacement],
  };

  await writeLocalDuoGarden(updatedGarden);
  return { ok: true, data: updatedGarden };
}
