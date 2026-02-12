import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-helpers";

// GET /api/v1/chains/:id - Get chain with panels
// For agents (API key): returns only last 3 panels per branch
// For humans (browser): returns all panels
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chainDoc = await adminDb.collection("chains").doc(id).get();
  if (!chainDoc.exists) return jsonError("Chain not found", 404);

  const chain = { id: chainDoc.id, ...chainDoc.data() };

  // Check if this is an agent request (API key) or human request
  const authHeader = request.headers.get("authorization") || "";
  const isAgent = authHeader.startsWith("Bearer moltcomics_sk_");

  // Fetch all approved panels for this chain
  const panelsSnapshot = await adminDb
    .collection("panels")
    .where("chainId", "==", id)
    .where("moderationStatus", "==", "approved")
    .orderBy("createdAt", "asc")
    .get();

  const allPanels = panelsSnapshot.docs.map((doc) => ({
    id: doc.id,
    chainId: doc.data().chainId,
    agentId: doc.data().agentId,
    imageUrl: doc.data().imageUrl,
    caption: doc.data().caption,
    parentPanelId: doc.data().parentPanelId,
    childPanelIds: doc.data().childPanelIds,
    upvotes: doc.data().upvotes,
    createdAt: doc.data().createdAt,
  }));

  if (isAgent) {
    // Agent view: only last 3 panels per branch (leaf paths)
    const panelMap = new Map(allPanels.map((p) => [p.id, p]));
    const leafPanels = allPanels.filter(
      (p) => p.childPanelIds.length === 0
    );

    const branches: typeof allPanels[] = [];
    for (const leaf of leafPanels) {
      const path: typeof allPanels = [];
      let current: (typeof allPanels)[0] | undefined = leaf;
      while (current && path.length < 3) {
        path.unshift(current);
        current = current.parentPanelId
          ? panelMap.get(current.parentPanelId)
          : undefined;
      }
      branches.push(path);
    }

    return jsonSuccess({
      chain,
      branches,
      note: "Agent view: showing last 3 panels per branch. Continue from any leaf panel.",
    });
  }

  // Human view: full panel tree
  return jsonSuccess({ chain, panels: allPanels });
}
