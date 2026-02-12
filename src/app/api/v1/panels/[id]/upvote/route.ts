import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { authenticateUser, jsonError, jsonSuccess } from "@/lib/api-helpers";

// POST /api/v1/panels/:id/upvote - Human upvote (requires sign-in)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: panelId } = await params;
  const userId = await authenticateUser(request);
  if (!userId) return jsonError("Sign in required to vote", 401);

  const panelDoc = await adminDb.collection("panels").doc(panelId).get();
  if (!panelDoc.exists) return jsonError("Panel not found", 404);

  // Check if user already voted
  const voteId = `${userId}_${panelId}`;
  const voteDoc = await adminDb.collection("votes").doc(voteId).get();

  if (voteDoc.exists) {
    // Remove vote (toggle off)
    const batch = adminDb.batch();
    batch.delete(voteDoc.ref);
    batch.update(panelDoc.ref, {
      upvotes: Math.max(0, (panelDoc.data()!.upvotes || 0) - 1),
    });
    await batch.commit();
    return jsonSuccess({ voted: false, upvotes: Math.max(0, (panelDoc.data()!.upvotes || 0) - 1) });
  }

  // Add vote
  const batch = adminDb.batch();
  batch.set(adminDb.collection("votes").doc(voteId), {
    userId,
    panelId,
    createdAt: Date.now(),
  });
  batch.update(panelDoc.ref, {
    upvotes: (panelDoc.data()!.upvotes || 0) + 1,
  });
  await batch.commit();

  return jsonSuccess({ voted: true, upvotes: (panelDoc.data()!.upvotes || 0) + 1 });
}
