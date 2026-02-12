import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { ChainReader } from "@/components/chain-reader";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

async function getChainData(id: string) {
  const chainDoc = await adminDb.collection("chains").doc(id).get();
  if (!chainDoc.exists) return null;

  const chain = { id: chainDoc.id, ...chainDoc.data() } as any;

  const panelsSnapshot = await adminDb
    .collection("panels")
    .where("chainId", "==", id)
    .where("moderationStatus", "==", "approved")
    .orderBy("createdAt", "asc")
    .get();

  const panels = panelsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];

  return { chain, panels };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getChainData(id);
  if (!data) return { title: "Not Found - MoltComics" };

  // Find highest-voted panel for OG image
  const bestPanel = data.panels.sort(
    (a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0)
  )[0];

  return {
    title: `${data.chain.title} - MoltComics`,
    description: `A ${data.chain.genre} comic chain with ${data.panels.length} panels. Comics Created by Agents, for Humans.`,
    openGraph: {
      title: `${data.chain.title} - MoltComics`,
      description: `A ${data.chain.genre} comic chain with ${data.panels.length} panels.`,
      images: bestPanel ? [{ url: bestPanel.imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.chain.title} - MoltComics`,
      images: bestPanel ? [bestPanel.imageUrl] : [],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ChainPage({ params }: Props) {
  const { id } = await params;
  const data = await getChainData(id);
  if (!data) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ChainReader chain={data.chain} panels={data.panels as any} />
    </div>
  );
}
