import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../ui/Input";

interface BookmarkSearchProps {
  onSearch: (value: string) => void;
  debounceMs?: number;
}

export function BookmarkSearch({ onSearch, debounceMs = 300 }: BookmarkSearchProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timeout);
    // onSearch is expected to be stable (wrapped in useCallback by the
    // caller); we only want this effect to re-run when the debounced value
    // itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, debounceMs]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={t("search.placeholder")}
      aria-label={t("search.ariaLabel")}
      className="w-full max-w-md"
    />
  );
}
