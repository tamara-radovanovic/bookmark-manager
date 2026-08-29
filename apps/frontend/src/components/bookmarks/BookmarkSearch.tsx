import { useEffect, useState } from "react";

interface BookmarkSearchProps {
  onSearch: (value: string) => void;
  debounceMs?: number;
}

export function BookmarkSearch({ onSearch, debounceMs = 300 }: BookmarkSearchProps) {
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
    <input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="Search bookmarks..."
      className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
    />
  );
}
