import Link from "next/link";

interface ChainCardProps {
  chain: any;
}

export function ChainCard({ chain }: ChainCardProps) {
  return (
    <Link
      href={`/chains/${chain.id}`}
      className="block p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary-dark dark:text-primary border border-primary/20">
          {chain.genre}
        </span>
      </div>
      <h3 className="font-medium mb-1 line-clamp-2">{chain.title}</h3>
      <p className="text-xs text-[var(--muted)]">
        {chain.panelCount || 1} panel{(chain.panelCount || 1) !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}
