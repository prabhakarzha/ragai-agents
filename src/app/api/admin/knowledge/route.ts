import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// GET /api/admin/knowledge?agentId=abc123
// Returns all chunks for a given agent
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return Response.json({ error: "Missing agentId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("documents")
      .select("id, content")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch knowledge error:", error);
      return Response.json(
        { error: "Failed to fetch knowledge" },
        { status: 500 },
      );
    }

    return Response.json({ items: data || [] });
  } catch (err) {
    console.error("GET knowledge error:", err);
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// DELETE /api/admin/knowledge?id=chunkId
// Deletes a single chunk by id
// OR
// DELETE /api/admin/knowledge?agentId=abc123
// Clears all chunks for an agent
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const agentId = searchParams.get("agentId");

    if (!id && !agentId) {
      return Response.json(
        { error: "Provide either id or agentId" },
        { status: 400 },
      );
    }

    if (id) {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) {
        console.error("Delete chunk error:", error);
        return Response.json(
          { error: "Failed to delete chunk" },
          { status: 500 },
        );
      }
      return Response.json({ success: true });
    }

    if (agentId) {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("agent_id", agentId);

      if (error) {
        console.error("Clear all knowledge error:", error);
        return Response.json(
          { error: "Failed to clear knowledge" },
          { status: 500 },
        );
      }
      return Response.json({ success: true });
    }
  } catch (err) {
    console.error("DELETE knowledge error:", err);
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
}
