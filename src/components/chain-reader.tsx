"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { PanelVote } from "@/components/panel-vote";

interface ChainReaderProps {
  chain: any;
  panels: any[];
}

export function ChainReader({ chain, panels }: ChainReaderProps) {
  const { user } = useAuth();

  // Build the linear path following highest-voted children
  const buildBestPath = (panels: any[]): any[] => {
    const path: any[] = [];
    let current = panels.find((p) => p.parentPanelId === null);
    while (current) {
      path.push(current);
      const children = panels.filter((p) => p.parentPanelId === current.id);
      if (children.length === 0) break;
      current = children.sort(
        (a, b) => (b.upvotes || 0) - (a.upvotes || 0)
      )[0];
    }
    return path;
  };

  const [activePath, setActivePath] = useState<any[]>(buildBestPath(panels));

  // Get branch info for each panel in the path
  const getBranchCount = (panelId: string): number => {
    return panels.filter((p) => p.parentPanelId === panelId).length;
  };

  const switchBranch = (parentPanelId: string, childPanelId: string) => {
    // Rebuild path from this branch point
    const pathUpToParent = activePath.slice(
      0,
      activePath.findIndex((p) => p.id === parentPanelId) + 1
    );

    let current = panels.find((p) => p.id === childPanelId);
    const newTail: any[] = [];
    while (current) {
      newTail.push(current);
      const children = panels.filter((p) => p.parentPanelId === current.id);
      if (children.length === 0) break;
      current = children.sort(
        (a, b) => (b.upvotes || 0) - (a.upvotes || 0)
      )[0];
    }

    setActivePath([...pathUpToParent, ...newTail]);
  };

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "";

  return (
    <div>
      {/* Chain header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary-dark dark:text-primary border border-primary/20">
            {chain.genre}
          </span>
          <span className="text-xs text-neutral-400">
            {chain.panelCount || panels.length} panels
          </span>
        </div>
        <h1 className="text-2xl font-bold">{chain.title}</h1>
      </div>

      {/* Panels */}
      <div className="space-y-8">
        {activePath.map((panel, index) => {
          const branchCount = getBranchCount(panel.id);
          const siblings = panels.filter(
            (p) => p.parentPanelId === panel.parentPanelId && p.id !== panel.id
          );

          return (
            <div key={panel.id}>
              {/* Branch indicator */}
              {siblings.length > 0 && (
                <div className="mb-2 flex items-center gap-2 text-xs text-neutral-400">
                  <span>
                    {siblings.length} alternate path
                    {siblings.length !== 1 ? "s" : ""}
                  </span>
                  {siblings.map((sib: any) => (
                    <button
                      key={sib.id}
                      onClick={() =>
                        switchBranch(panel.parentPanelId, sib.id)
                      }
                      className="underline hover:no-underline"
                    >
                      switch
                    </button>
                  ))}
                </div>
              )}

              {/* Panel image */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <Image
                  src={panel.imageUrl}
                  alt={panel.caption || `Panel ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>

              {/* Caption and actions */}
              <div className="mt-2 flex items-start justify-between">
                <div>
                  {panel.caption && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {panel.caption}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">
                    Panel {index + 1}
                    {branchCount > 1 && ` · ${branchCount} branches`}
                  </p>
                </div>
                <PanelVote panelId={panel.id} upvotes={panel.upvotes || 0} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Share */}
      <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: chain.title, url: shareUrl });
            } else {
              navigator.clipboard.writeText(shareUrl);
            }
          }}
          className="text-sm underline hover:no-underline"
        >
          Share this chain
        </button>
      </div>
    </div>
  );
}
