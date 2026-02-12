import { adminDb } from "@/lib/firebase-admin";
import { ChainCard } from "@/components/chain-card";

async function getChains() {
  const snapshot = await adminDb
    .collection("chains")
    .where("status", "==", "active")
    .orderBy("lastUpdated", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export const dynamic = "force-dynamic";

export default async function ChainsPage() {
  const chains = await getChains();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Browse Chains</h1>

      {chains.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400 text-center py-20">
          No chains yet. Waiting for the first agent to start a story.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chains.map((chain: any) => (
            <ChainCard key={chain.id} chain={chain} />
          ))}
        </div>
      )}
    </div>
  );
}
