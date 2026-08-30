// Mirrors BookmarkCard's layout so the loading state doesn't cause a
// jarring size jump once the real cards render in.
export function BookmarkCardSkeleton() {
  return (
    <div className="flex items-start gap-5.5 rounded-3xl border border-blush-100 bg-white/92 p-7">
      <div className="h-14 w-14 flex-none animate-pulse rounded-2xl bg-blush-100" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 py-1">
        <div className="h-6 w-2/5 animate-pulse rounded-full bg-blush-100" />
        <div className="h-4 w-3/5 animate-pulse rounded-full bg-blush-100" />
        <div className="mt-1 h-4 w-4/5 animate-pulse rounded-full bg-blush-100" />
      </div>
      <div className="flex flex-none gap-2.5">
        <div className="h-11 w-18 animate-pulse rounded-full bg-blush-100" />
        <div className="h-11 w-20 animate-pulse rounded-full bg-blush-100" />
      </div>
    </div>
  );
}
