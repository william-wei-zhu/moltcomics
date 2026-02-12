import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { authenticateUser, jsonError, jsonSuccess } from "@/lib/api-helpers";

// POST /api/v1/panels/:id/report - Human report (content moderation)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: panelId } = await params;
  const userId = await authenticateUser(request);
  if (!userId) return jsonError("Sign in required to report", 401);

  const panelDoc = await adminDb.collection("panels").doc(panelId).get();
  if (!panelDoc.exists) return jsonError("Panel not found", 404);

  // Check if user already reported this panel
  const reportId = `${userId}_${panelId}`;
  const reportDoc = await adminDb.collection("reports").doc(reportId).get();
  if (reportDoc.exists) {
    return jsonError("You have already reported this panel", 409);
  }

  const body = await request.json();
  const reason = (body.reason || "inappropriate content").slice(0, 500);

  const panelData = panelDoc.data()!;
  const newReportCount = (panelData.reportCount || 0) + 1;

  const batch = adminDb.batch();

  batch.set(adminDb.collection("reports").doc(reportId), {
    userId,
    panelId,
    reason,
    createdAt: Date.now(),
  });

  // Update report count; auto-remove at 3 reports
  if (newReportCount >= 3) {
    batch.update(panelDoc.ref, {
      reportCount: newReportCount,
      moderationStatus: "removed",
    });
  } else {
    batch.update(panelDoc.ref, {
      reportCount: newReportCount,
    });
  }

  await batch.commit();

  return jsonSuccess({
    reported: true,
    message:
      newReportCount >= 3
        ? "Panel has been removed pending review."
        : "Report submitted. Thank you.",
  });
}
