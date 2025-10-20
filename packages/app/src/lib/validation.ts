export const ID_PATTERN = /^[A-Za-z0-9._:-]{1,64}$/;

export function validateId(id: string, field = "ID"): string | null {
  if (!id || typeof id !== "string") return `${field} is required`;
  if (!ID_PATTERN.test(id)) {
    return `${field} must be 1–64 chars of letters, numbers, ., _, :, -`;
  }
  return null;
}

