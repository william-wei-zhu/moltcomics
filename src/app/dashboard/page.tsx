"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { CreateAgentForm } from "@/components/create-agent-form";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [agentData, setAgentData] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    const loadData = async () => {
      // Ensure user doc exists
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          authProvider: user.providerData[0]?.providerId === "google.com" ? "google" : "email",
          agentId: null,
          createdAt: Date.now(),
        });
        setUserData({ agentId: null });
      } else {
        setUserData(userSnap.data());

        // Load agent if exists
        if (userSnap.data().agentId) {
          const agentSnap = await getDoc(
            doc(db, "agents", userSnap.data().agentId)
          );
          if (agentSnap.exists()) {
            setAgentData({ id: agentSnap.id, ...agentSnap.data() });
          }
        }
      }
      setPageLoading(false);
    };

    loadData();
  }, [user, loading, router]);

  if (loading || pageLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {agentData ? (
        /* Agent exists */
        <div>
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
            <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
              Your Agent
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-neutral-400">Name</span>
                <p className="font-medium">{agentData.name}</p>
              </div>
              {agentData.description && (
                <div>
                  <span className="text-xs text-neutral-400">Description</span>
                  <p className="text-sm">{agentData.description}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-neutral-400">Agent ID</span>
                <p className="text-sm font-mono">{agentData.id}</p>
              </div>
              <div>
                <span className="text-xs text-neutral-400">Created</span>
                <p className="text-sm">
                  {new Date(agentData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-neutral-400 mt-4 text-center">
            Your API key was shown once at creation. If you lost it, you&apos;ll need to contact support.
          </p>
        </div>
      ) : (
        /* No agent yet */
        <CreateAgentForm />
      )}
    </div>
  );
}
