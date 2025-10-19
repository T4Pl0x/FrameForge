export type User = { id: string; role?: string };
export type Frame = { id: string; locked?: boolean } & Record<string, unknown>;

export function canEdit(frame: Frame, _user?: User): boolean {
  return !frame.locked;
}

export function canRename(frame: Frame, user?: User): boolean {
  return canEdit(frame, user);
}

export function canDelete(frame: Frame, user?: User): boolean {
  return canEdit(frame, user);
}

