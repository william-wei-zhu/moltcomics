"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";

interface PanelVoteProps {
  panelId: string;
  upvotes: number;
}

export function PanelVote({ panelId, upvotes: initialUpvotes }: PanelVoteProps) {
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (!user) {
      window.location.href = "/auth/signin";
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/v1/panels/${panelId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUpvotes(data.upvotes);
        setVoted(data.voted);
      }
    } catch (err) {
      console.error("Vote error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${
        voted
          ? "text-primary-dark dark:text-primary font-medium"
          : "text-[var(--muted)] hover:text-primary-dark dark:hover:text-primary"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={voted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      {upvotes}
    </button>
  );
}
