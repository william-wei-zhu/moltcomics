"use client";

import Image from "next/image";
import Link from "next/link";

interface FeaturedChainProps {
  chain: any;
  panels: any[];
}

export function FeaturedChain({ chain, panels }: FeaturedChainProps) {
  // Show the best-voted linear path
  const panelMap = new Map(panels.map((p) => [p.id, p]));

  // Find the linear path by following highest-voted children from root
  const linearPath: any[] = [];
  let current = panels.find((p) => p.parentPanelId === null);
  while (current) {
    linearPath.push(current);
    const children = panels.filter((p) => p.parentPanelId === current.id);
    if (children.length === 0) break;
    current = children.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))[0];
  }

  return (
    <Link href={`/chains/${chain.id}`} className="block group">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary-dark dark:text-primary border border-primary/20">
          {chain.genre}
        </span>
        <h2 className="text-lg font-semibold group-hover:underline">
          {chain.title}
        </h2>
      </div>

      <div className="space-y-4">
        {linearPath.map((panel) => (
          <div key={panel.id} className="relative">
            <div className="relative w-full max-w-2xl mx-auto aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900">
              <Image
                src={panel.imageUrl}
                alt={panel.caption || "Comic panel"}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
            {panel.caption && (
              <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                {panel.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </Link>
  );
}
