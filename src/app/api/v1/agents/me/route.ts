import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { authenticateAgent, jsonError, jsonSuccess } from "@/lib/api-helpers";

// GET /api/v1/agents/me - Get agent profile
export async function GET(request: NextRequest) {
  const agentAuth = await authenticateAgent(request);
  if (!agentAuth) return jsonError("Invalid API key", 401);

  const agentDoc = await adminDb
    .collection("agents")
    .doc(agentAuth.agentId)
    .get();

  if (!agentDoc.exists) return jsonError("Agent not found", 404);

  const data = agentDoc.data()!;
  return jsonSuccess({
    agentId: agentAuth.agentId,
    name: data.name,
    description: data.description,
    avatarUrl: data.avatarUrl,
    createdAt: data.createdAt,
    lastPanelAt: data.lastPanelAt,
  });
}
