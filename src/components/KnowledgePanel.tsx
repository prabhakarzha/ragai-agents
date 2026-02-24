"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { getOrCreateAgentId } from "@/lib/agent";

type KnowledgeChunk = { id: string; content: string };

export type KnowledgePanelRef = {
  refetch: () => void;
};

const KnowledgePanel = forwardRef<KnowledgePanelRef>(
  function KnowledgePanel(_, ref) {
    const agentId = getOrCreateAgentId();
    const [knowledge, setKnowledge] = useState<KnowledgeChunk[]>([]);
    const [loading, setLoading] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const load = async () => {
      setLoading(true);
      setStatus(null);
      try {
        const res = await fetch(`/api/admin/knowledge?agentId=${agentId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load knowledge");
        setKnowledge(data.items || []);
      } catch (e: unknown) {
        setStatus("❌ Failed to load knowledge");
      } finally {
        setLoading(false);
      }
    };

    const deleteChunk = async (id: string) => {
      if (!confirm("Delete this chunk?")) return;
      try {
        const res = await fetch(`/api/admin/knowledge?id=${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Delete failed");
        setKnowledge((prev) => prev.filter((k) => k.id !== id)); // optimistic update
        setStatus("✅ Chunk deleted");
      } catch (e) {
        setStatus("❌ Failed to delete chunk");
      }
    };

    const clearAll = async () => {
      if (!confirm("This will delete ALL knowledge for this agent. Continue?"))
        return;
      setDeletingAll(true);
      try {
        const res = await fetch(`/api/admin/knowledge?agentId=${agentId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Clear failed");
        setKnowledge([]);
        setStatus("✅ All knowledge cleared");
      } catch (e) {
        setStatus("❌ Failed to clear knowledge");
      } finally {
        setDeletingAll(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refetch: load,
    }));

    useEffect(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agentId]);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Knowledge</h2>
          <button
            onClick={clearAll}
            disabled={deletingAll || knowledge.length === 0}
            className="px-3 py-1.5 rounded-md bg-red-500 text-white text-sm disabled:opacity-50"
          >
            {deletingAll ? "Clearing..." : "Clear All"}
          </button>
        </div>

        {status && <div className="text-sm">{status}</div>}

        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : knowledge.length === 0 ? (
          <div className="text-sm text-gray-500">No knowledge yet.</div>
        ) : (
          knowledge.map((k, i) => (
            <div
              key={k.id}
              className="border rounded-lg p-3 text-sm flex items-start justify-between gap-3"
            >
              <div>
                <div className="font-medium">Chunk {i + 1}</div>
                <div className="text-gray-600">
                  {k.content.slice(0, 120)}
                  {k.content.length > 120 ? "..." : ""}
                </div>
              </div>

              <button
                onClick={() => deleteChunk(k.id)}
                className="px-3 py-1.5 rounded-md bg-red-100 text-red-600 text-xs hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    );
  },
);

export default KnowledgePanel;
