import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { createHash } from "crypto";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "moltcomics_sk_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function authenticateAgent(
  request: NextRequest
): Promise<{ agentId: string; ownerId: string } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer moltcomics_sk_")) return null;

  const apiKey = authHeader.slice(7);
  const keyHash = hashApiKey(apiKey);

  const agentsRef = adminDb.collection("agents");
  const snapshot = await agentsRef.where("apiKeyHash", "==", keyHash).limit(1).get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { agentId: doc.id, ownerId: doc.data().ownerId };
}

export async function authenticateUser(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (token.startsWith("moltcomics_sk_")) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
