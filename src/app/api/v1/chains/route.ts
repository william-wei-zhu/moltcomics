import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { adminStorage } from "@/lib/firebase-admin";
import {
  authenticateAgent,
  jsonError,
  jsonSuccess,
} from "@/lib/api-helpers";
import { moderateImage } from "@/lib/moderation";
import { GENRES, Genre } from "@/lib/types";

// GET /api/v1/chains - List chains
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "recent";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  let query = adminDb
    .collection("chains")
    .where("status", "==", "active");

  if (sort === "top") {
    query = query.orderBy("lastUpdated", "desc");
  } else {
    query = query.orderBy("lastUpdated", "desc");
  }

  const snapshot = await query.limit(limit).get();
  const chains = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return jsonSuccess({ chains });
}

// POST /api/v1/chains - Start a new chain
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
  const title = formData.get("title") as string;
  const genre = formData.get("genre") as string;
  const caption = formData.get("caption") as string;
  const imageFile = formData.get("image") as File | null;

  if (!title || title.trim().length === 0) {
    return jsonError("Title is required", 400);
  }
  if (title.length > 200) {
    return jsonError("Title must be 200 characters or less", 400);
  }
  if (!genre || !GENRES.includes(genre as Genre)) {
    return jsonError(`Genre must be one of: ${GENRES.join(", ")}`, 400);
  }
  if (!imageFile) {
    return jsonError("Image file is required", 400);
  }
  if (imageFile.size > 10 * 1024 * 1024) {
    return jsonError("Image must be 10 MB or less", 400);
  }
  if (!imageFile.type.startsWith("image/")) {
    return jsonError("File must be an image", 400);
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

  // Create chain and root panel
  const now = Date.now();
  const chainRef = adminDb.collection("chains").doc();
  const panelRef = adminDb.collection("panels").doc();

  const batch = adminDb.batch();

  batch.set(panelRef, {
    chainId: chainRef.id,
    agentId: agentAuth.agentId,
    imageUrl,
    caption: (caption || "").slice(0, 1000),
    parentPanelId: null,
    childPanelIds: [],
    upvotes: 0,
    createdAt: now,
    moderationStatus: modResult.approved ? "approved" : "pending",
    reportCount: 0,
  });

  batch.set(chainRef, {
    title: title.trim(),
    genre,
    creatorAgentId: agentAuth.agentId,
    status: "active",
    rootPanelId: panelRef.id,
    panelCount: 1,
    createdAt: now,
    lastUpdated: now,
  });

  batch.update(adminDb.collection("agents").doc(agentAuth.agentId), {
    lastPanelAt: now,
  });

  await batch.commit();

  return jsonSuccess(
    {
      chainId: chainRef.id,
      panelId: panelRef.id,
      imageUrl,
      moderation: modResult.approved ? "approved" : "pending_review",
    },
    201
  );
}
