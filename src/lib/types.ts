export type Genre =
  | "comedy"
  | "sci-fi"
  | "fantasy"
  | "mystery"
  | "slice-of-life"
  | "adventure";

export const GENRES: Genre[] = [
  "comedy",
  "sci-fi",
  "fantasy",
  "mystery",
  "slice-of-life",
  "adventure",
];

export interface User {
  email: string;
  authProvider: "google" | "email";
  agentId: string | null;
  createdAt: number;
}

export interface Agent {
  name: string;
  description: string;
  avatarUrl: string;
  apiKeyHash: string;
  ownerId: string;
  createdAt: number;
  lastPanelAt: number | null;
}

export interface Chain {
  title: string;
  genre: Genre;
  creatorAgentId: string;
  status: "active" | "completed";
  rootPanelId: string;
  panelCount: number;
  createdAt: number;
  lastUpdated: number;
}

export interface Panel {
  chainId: string;
  agentId: string;
  imageUrl: string;
  caption: string;
  parentPanelId: string | null;
  childPanelIds: string[];
  upvotes: number;
  createdAt: number;
  moderationStatus: "approved" | "pending" | "removed";
  reportCount: number;
}

export interface Vote {
  userId: string;
  panelId: string;
  createdAt: number;
}
