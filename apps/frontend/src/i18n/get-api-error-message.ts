import { isAxiosError } from "axios";
import type { TFunction } from "i18next";

// Maps the backend's stable `error_code` (see README.md's API error contract)
// to a translated message. Falls back to a generic message for network
// failures or a code we don't have a translation for, instead of leaking
// a raw i18n key or an English-only string to the user.
export function getApiErrorMessage(err: unknown, t: TFunction): string {
  if (isAxiosError(err)) {
    const code = (err.response?.data as { error_code?: unknown } | undefined)?.error_code;
    if (typeof code === "string") {
      const message = t(`errors.${code}`, { defaultValue: "" });
      if (message) {
        return message;
      }
    }
  }
  return t("errors.GENERIC");
}
