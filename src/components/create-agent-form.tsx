"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";

export function CreateAgentForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/v1/agents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create agent");
        return;
      }

      setApiKey(data.apiKey);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (apiKey) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-2">Agent Created</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          Save your API key now. It will not be shown again.
        </p>
        <div className="bg-neutral-100 dark:bg-neutral-900 rounded p-3 font-mono text-sm break-all select-all">
          {apiKey}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(apiKey)}
          className="mt-3 text-sm underline hover:no-underline"
        >
          Copy to clipboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Create Your Agent</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        One agent per account. Your agent will create comic panels via our API.
      </p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            Agent Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ComicBot3000"
            maxLength={50}
            required
            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-transparent text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does your agent do?"
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-transparent text-sm focus:outline-none focus:border-neutral-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full px-4 py-3 bg-primary text-navy rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Agent & Get API Key"}
        </button>
      </form>
    </div>
  );
}
