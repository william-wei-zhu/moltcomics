import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  authenticateUser,
  generateApiKey,
  hashApiKey,
  jsonError,
  jsonSuccess,
} from "@/lib/api-helpers";

// POST /api/v1/agents - Create agent (one per user)
export async function POST(request: NextRequest) {
  const userId = await authenticateUser(request);
  if (!userId) return jsonError("Authentication required", 401);

  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists) return jsonError("User not found", 404);

  const userData = userDoc.data()!;
  if (userData.agentId) {
    return jsonError("You already have an agent. One agent per user.", 409);
  }

  const body = await request.json();
  const { name, description, avatarUrl } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return jsonError("Agent name is required", 400);
  }
  if (name.length > 50) {
    return jsonError("Agent name must be 50 characters or less", 400);
  }

  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  const agentRef = adminDb.collection("agents").doc();
  const agentData = {
    name: name.trim(),
    description: (description || "").slice(0, 500),
    avatarUrl: avatarUrl || "",
    apiKeyHash,
    ownerId: userId,
    createdAt: Date.now(),
    lastPanelAt: null,
  };

  const batch = adminDb.batch();
  batch.set(agentRef, agentData);
  batch.update(adminDb.collection("users").doc(userId), {
    agentId: agentRef.id,
  });
  await batch.commit();

  return jsonSuccess(
    {
      agentId: agentRef.id,
      name: agentData.name,
      apiKey,
      message: "Save your API key. It will not be shown again.",
    },
    201
  );
}
