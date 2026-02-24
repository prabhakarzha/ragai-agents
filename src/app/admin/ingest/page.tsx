"use client";

import { useEffect, useState, useRef } from "react";
import { getOrCreateAgentId } from "@/lib/agent";
import { useRouter } from "next/navigation";
import KnowledgePanel, { KnowledgePanelRef } from "@/components/KnowledgePanel";

type KnowledgeChunk = {
  id: string;
  content: string;
};

export default function AdminIngestPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [knowledge, setKnowledge] = useState<KnowledgeChunk[]>([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const agentId = getOrCreateAgentId(); // 👈 agent id yahin se milega

  const knowledgeRef = useRef<KnowledgePanelRef>(null); // 👈 NEW

  const ingest = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, agentId }), // 👈 yahin pass karo
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingestion failed");

      setStatus(`✅ Ingested ${data.chunks} chunks successfully`);
      setText("");

      // 🔁 Real-time refresh of KnowledgePanel
      knowledgeRef.current?.refetch();
    } catch (err: unknown) {
      if (err instanceof Error) setStatus(`❌ ${err.message}`);
      else setStatus("❌ Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledge = async () => {
    setLoadingKnowledge(true);
    try {
      const res = await fetch(`/api/admin/knowledge?agentId=${agentId}`);
      const data = await res.json();
      if (res.ok) {
        setKnowledge(data.items || []);
      }
    } catch (e) {
      console.error("Failed to load knowledge", e);
    } finally {
      setLoadingKnowledge(false);
    }
  };

  const deleteChunk = async (id: string) => {
    if (!confirm("Delete this chunk?")) return;
    try {
      await fetch(`/api/admin/knowledge?id=${id}`, { method: "DELETE" });
      setKnowledge((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      alert("Failed to delete chunk");
    }
  };

  const clearAll = async () => {
    if (!confirm("This will delete ALL knowledge for this agent. Continue?"))
      return;
    setDeletingAll(true);
    try {
      await fetch(`/api/admin/knowledge?agentId=${agentId}`, {
        method: "DELETE",
      });
      setKnowledge([]);
    } catch (e) {
      alert("Failed to clear knowledge");
    } finally {
      setDeletingAll(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Personal Private Information</h1>
          <button
            onClick={() => router.push("/rag")}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50"
          >
            ← Back to Chat
          </button>
        </div>

        {/* Ingest Section */}
        <textarea
          className="w-full min-h-[240px] border rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Paste your document text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={ingest}
          disabled={loading || !text.trim()}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>

        {status && <div className="text-sm">{status}</div>}

        {/* Divider */}
        <div className="border-t pt-4" />

        {/* 👇 Pass ref to KnowledgePanel for real-time refresh */}
        <KnowledgePanel ref={knowledgeRef} />
      </div>
    </div>
  );
}
