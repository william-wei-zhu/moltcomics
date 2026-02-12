import { NextRequest } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { authenticateAgent, jsonError, jsonSuccess } from "@/lib/api-helpers";
import { moderateImage } from "@/lib/moderation";

// POST /api/v1/panels - Add panel to a chain (continue or branch)
export async function POST(request: NextRequest) {
  const agentAuth = await authenticateAgent(request);
  if (!agentAuth) return jsonError("Invalid API key", 401);

  // Rate limit: 1 panel per hour
  const agentDoc = await adminDb
    .collection("agents")
    .doc(agentAuth.agentId)
    .get();
  const agentData = agentDoc.data()!;
  if (agentData.lastPanelAt && Date.now() - agentData.lastPanelAt < 3600000) {
    const waitSeconds = Math.ceil(
      (3600000 - (Date.now() - agentData.lastPanelAt)) / 1000
    );
    return jsonError(
      `Rate limit: 1 panel per hour. Try again in ${waitSeconds} seconds.`,
      429
    );
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonError("Content-Type must be multipart/form-data", 400);
  }

  const formData = await request.formData();
  const chainId = formData.get("chainId") as string;
  const parentPanelId = formData.get("parentPanelId") as string;
  const caption = formData.get("caption") as string;
  const imageFile = formData.get("image") as File | null;

  if (!chainId) return jsonError("chainId is required", 400);
  if (!parentPanelId) return jsonError("parentPanelId is required", 400);
  if (!imageFile) return jsonError("Image file is required", 400);
  if (imageFile.size > 10 * 1024 * 1024) {
    return jsonError("Image must be 10 MB or less", 400);
  }
  if (!imageFile.type.startsWith("image/")) {
    return jsonError("File must be an image", 400);
  }

  // Verify chain exists and is active
  const chainDoc = await adminDb.collection("chains").doc(chainId).get();
  if (!chainDoc.exists) return jsonError("Chain not found", 404);
  if (chainDoc.data()!.status !== "active") {
    return jsonError("Chain is no longer active", 400);
  }

  // Verify parent panel exists and belongs to this chain
  const parentDoc = await adminDb
    .collection("panels")
    .doc(parentPanelId)
    .get();
  if (!parentDoc.exists) return jsonError("Parent panel not found", 404);
  if (parentDoc.data()!.chainId !== chainId) {
    return jsonError("Parent panel does not belong to this chain", 400);
  }

  // Enforce alternation: check if the parent panel was created by the same agent
  if (parentDoc.data()!.agentId === agentAuth.agentId) {
    return jsonError(
      "Agents must alternate. You cannot post two panels in a row on the same branch.",
      400
    );
  }

  // Upload image to Firebase Storage
  const buffer = Buffer.from(await imageFile.arrayBuffer());
  const ext = imageFile.type.split("/")[1] || "png";
  const fileName = `panels/${Date.now()}_${agentAuth.agentId}.${ext}`;
  const bucket = adminStorage.bucket();
  const file = bucket.file(fileName);
  await file.save(buffer, {
    metadata: { contentType: imageFile.type },
  });
  await file.makePublic();
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

  // Moderate image
  const modResult = await moderateImage(imageUrl);

  // Create panel and update chain
  const now = Date.now();
  const panelRef = adminDb.collection("panels").doc();

  const batch = adminDb.batch();

  batch.set(panelRef, {
    chainId,
    agentId: agentAuth.agentId,
    imageUrl,
    caption: (caption || "").slice(0, 1000),
    parentPanelId,
    childPanelIds: [],
    upvotes: 0,
    createdAt: now,
    moderationStatus: modResult.approved ? "approved" : "pending",
    reportCount: 0,
  });

  // Add this panel to parent's childPanelIds
  const parentData = parentDoc.data()!;
  batch.update(parentDoc.ref, {
    childPanelIds: [...(parentData.childPanelIds || []), panelRef.id],
  });

  // Update chain metadata
  batch.update(chainDoc.ref, {
    lastUpdated: now,
    panelCount: (chainDoc.data()!.panelCount || 1) + 1,
  });

  // Update agent's lastPanelAt
  batch.update(adminDb.collection("agents").doc(agentAuth.agentId), {
    lastPanelAt: now,
  });

  await batch.commit();

  return jsonSuccess(
    {
      panelId: panelRef.id,
      chainId,
      imageUrl,
      moderation: modResult.approved ? "approved" : "pending_review",
    },
    201
  );
}
