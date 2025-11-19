"use client";
import React, { useEffect, useState } from "react";

export default function AdminClient() {
  type Tab = "Reports" | "Stations" | "Content" | "Clubs" | "Users" | "Analytics";
  const [tab, setTab] = useState<Tab>("Reports");

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-900 via-emerald-700/40 to-sky-900/50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-emerald-100">(Admin Dashboard)</h1>
          <div className="flex gap-2">
            {(["Reports", "Stations", "Content", "Clubs", "Users", "Analytics"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-sm ${tab === t ? "bg-emerald-600 text-white" : "bg-white/30 dark:bg-emerald-900/30 border border-white/20"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === "Reports" ? <ReportsPanel /> : null}
        {tab === "Stations" ? <StationsPanel /> : null}
        {tab === "Content" ? <ContentPanel /> : null}
        {tab === "Clubs" ? <Placeholder title="Clubs" /> : null}
        {tab === "Users" ? <UsersPanel /> : null}
        {tab === "Analytics" ? <Placeholder title="Analytics" /> : null}
      </div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl backdrop-blur-xl bg-white/20 border border-white/20 p-6 text-emerald-100">
      {"// TODO: clarify requirement before implementation — " + title}
    </div>
  );
}

function ReportsPanel() {
  const [items, setItems] = useState<
    Array<{
      id: string;
      postId: string | null;
      reason: string;
      status: string;
      createdAt: string;
      postTitle: string | null;
      reporter: { fullName: string | null; email: string };
      reportedUser: { id: string; fullName: string | null; email: string } | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (res.ok && Array.isArray(data.reports)) setItems(data.reports);
      setLoading(false);
    })();
  }, []);

  const act = async (id: string, action: "resolve" | "delete" | "block_user") => {
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: "RESOLVED" } : r)));
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl backdrop-blur-xl bg-white/25 border border-white/20" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-2 rounded-xl backdrop-blur-xl bg-white/25 border border-white/20 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1 text-sm text-emerald-100">
                <div className="font-semibold text-emerald-50 text-xs mb-1">
                  {r.postTitle || "Reported user / activity"}
                </div>
                <div className="text-xs mb-1">Reason: {r.reason}</div>
                <div className="text-[11px] text-emerald-100/70">
                  Reporter: {r.reporter.fullName || "(no name)"} · {r.reporter.email}
                </div>
                {r.reportedUser ? (
                  <div className="text-[11px] text-emerald-100/70">
                    Reported person: {r.reportedUser.fullName || "(no name)"} · {r.reportedUser.email}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                  {r.status}
                </span>
                <button
                  onClick={() => act(r.id, "resolve")}
                  className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px]"
                >
                  Mark resolved
                </button>
                {r.postId ? (
                  <button
                    onClick={() => act(r.id, "delete")}
                    className="px-2 py-1 rounded bg-red-600 text-white text-[11px]"
                  >
                    Delete post
                  </button>
                ) : null}
                {r.reportedUser ? (
                  <button
                    onClick={() => act(r.id, "block_user")}
                    className="px-2 py-1 rounded bg-red-700 text-white text-[11px]"
                  >
                    Block user
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type AdminUser = {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
  accountType: string;
  clubName: string | null;
  institutionName: string | null;
  isVerified: boolean;
  createdAt: string;
};

function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);

  const fetchUsers = async (q?: string) => {
    setLoading(true);
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const res = await fetch(`/api/admin/users${params}`);
    const data = await res.json();
    if (res.ok && Array.isArray(data.users)) {
      const mapped: AdminUser[] = data.users.map((u: any) => ({
        id: u.id,
        fullName: u.fullName ?? null,
        email: u.email,
        role: u.role,
        accountType: u.accountType,
        clubName: u.clubName ?? null,
        institutionName: u.institutionName ?? null,
        isVerified: Boolean(u.isVerified),
        createdAt:
          typeof u.createdAt === "string"
            ? u.createdAt
            : new Date(u.createdAt).toISOString(),
      }));
      setUsers(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search.trim() || undefined);
  };

  const updateUser = async (id: string, updates: { role?: string; deactivate?: boolean; reactivate?: boolean }) => {
    setPending(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.user) {
      const u = data.user;
      const mapped: AdminUser = {
        id: u.id,
        fullName: u.fullName ?? null,
        email: u.email,
        role: u.role,
        accountType: u.accountType,
        clubName: u.clubName ?? null,
        institutionName: u.institutionName ?? null,
        isVerified: Boolean(u.isVerified),
        createdAt:
          typeof u.createdAt === "string"
            ? u.createdAt
            : new Date(u.createdAt).toISOString(),
      };
      setUsers((prev) => prev.map((usr) => (usr.id === id ? mapped : usr)));
    }
    setPending(false);
  };

  const roles: string[] = ["INDIVIDUAL", "CLUB_ADMIN", "SUPER_ADMIN"];

  return (
    <div className="space-y-4">
      <form onSubmit={onSearchSubmit} className="flex flex-wrap gap-2 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, club, institution"
          className="px-3 py-1 rounded bg-white/70 text-sm flex-1 min-w-[180px]"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl backdrop-blur-xl bg-white/25 border border-white/20"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl backdrop-blur-xl bg-white/20 border border-white/20 p-4 text-sm text-emerald-100/80">
          No users found.
        </div>
      ) : (
        <div className="rounded-2xl backdrop-blur-xl bg-white/20 border border-white/20 overflow-hidden">
          <div className="max-h-[480px] overflow-auto">
            <table className="min-w-full text-xs text-emerald-50/90">
              <thead className="bg-emerald-900/60">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Email</th>
                  <th className="px-3 py-2 text-left font-semibold">Account</th>
                  <th className="px-3 py-2 text-left font-semibold">Club / Institution</th>
                  <th className="px-3 py-2 text-left font-semibold">Role</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isActive = u.isVerified;
                  return (
                    <tr key={u.id} className="odd:bg-white/5 even:bg-emerald-900/10">
                      <td className="px-3 py-2 align-middle">
                        <div className="font-medium text-emerald-50 text-xs">
                          {u.fullName || "(no name)"}
                        </div>
                        <div className="text-[10px] text-emerald-100/60">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle text-emerald-50/90">
                        {u.email}
                      </td>
                      <td className="px-3 py-2 align-middle text-emerald-50/80">
                        {u.accountType}
                      </td>
                      <td className="px-3 py-2 align-middle text-emerald-50/80">
                        <div>{u.clubName || "-"}</div>
                        <div className="text-[10px] text-emerald-100/60">{u.institutionName || ""}</div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <select
                          value={u.role}
                          onChange={(e) => updateUser(u.id, { role: e.target.value })}
                          disabled={pending}
                          className="px-2 py-1 rounded bg-white/80 text-emerald-900 text-[11px]"
                        >
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            isActive ? "bg-emerald-500/90" : "bg-red-500/80"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            updateUser(u.id, {
                              deactivate: isActive,
                              reactivate: !isActive,
                            })
                          }
                          className={`px-2 py-1 rounded text-[11px] ${
                            isActive
                              ? "bg-red-600 text-white"
                              : "bg-emerald-500 text-white"
                          }`}
                        >
                          {isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

type AdminContentItem = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  sourceUrl: string;
  sourcePlatform: string;
  categories: string[];
  duration: string | null;
  author: string | null;
  publishDate: string;
  difficulty: string;
  tags: string[];
};

function ContentPanel() {
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState("youtube");
  const [categories, setCategories] = useState("");
  const [duration, setDuration] = useState("");
  const [author, setAuthor] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [tags, setTags] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");
  const [editSourceUrl, setEditSourceUrl] = useState("");
  const [editSourcePlatform, setEditSourcePlatform] = useState("youtube");
  const [editCategories, setEditCategories] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editPublishDate, setEditPublishDate] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("beginner");
  const [editTags, setEditTags] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/content-items");
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        const mapped: AdminContentItem[] = data.items.map(
          (it: { publishDate: string | Date } & Omit<AdminContentItem, "publishDate">) => ({
            ...it,
            publishDate:
              typeof it.publishDate === "string"
                ? it.publishDate
                : new Date(it.publishDate).toISOString(),
          }),
        );
        setItems(mapped);
      }
      setLoading(false);
    })();
  }, []);

  const resetCreateForm = () => {
    setTitle("");
    setDescription("");
    setThumbnailUrl("");
    setSourceUrl("");
    setSourcePlatform("youtube");
    setCategories("");
    setDuration("");
    setAuthor("");
    setPublishDate("");
    setDifficulty("beginner");
    setTags("");
  };

  const createItem = async () => {
    const body = {
      title,
      description,
      thumbnailUrl,
      sourceUrl,
      sourcePlatform,
      categories: categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      duration: duration || null,
      author: author || null,
      publishDate: publishDate || new Date().toISOString(),
      difficulty,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const res = await fetch("/api/admin/content-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.item) {
      const it = data.item as { publishDate: string | Date } & Omit<
        AdminContentItem,
        "publishDate"
      >;
      const mapped: AdminContentItem = {
        ...it,
        publishDate:
          typeof it.publishDate === "string"
            ? it.publishDate
            : new Date(it.publishDate).toISOString(),
      };
      setItems((prev) => [mapped, ...prev]);
      resetCreateForm();
    }
  };

  const startEdit = (item: AdminContentItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditThumbnailUrl(item.thumbnailUrl);
    setEditSourceUrl(item.sourceUrl);
    setEditSourcePlatform(item.sourcePlatform);
    setEditCategories(item.categories.join(", "));
    setEditDuration(item.duration ?? "");
    setEditAuthor(item.author ?? "");
    setEditPublishDate(item.publishDate);
    setEditDifficulty(item.difficulty);
    setEditTags(item.tags.join(", "));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const body = {
      title: editTitle,
      description: editDescription,
      thumbnailUrl: editThumbnailUrl,
      sourceUrl: editSourceUrl,
      sourcePlatform: editSourcePlatform,
      categories: editCategories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      duration: editDuration || null,
      author: editAuthor || null,
      publishDate: editPublishDate,
      difficulty: editDifficulty,
      tags: editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const res = await fetch(`/api/admin/content-items/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.item) {
      const it = data.item as { publishDate: string | Date } & Omit<
        AdminContentItem,
        "publishDate"
      >;
      const mapped: AdminContentItem = {
        ...it,
        publishDate:
          typeof it.publishDate === "string"
            ? it.publishDate
            : new Date(it.publishDate).toISOString(),
      };
      setItems((prev) => prev.map((c) => (c.id === editingId ? mapped : c)));
      setEditingId(null);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this content item? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/content-items/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/30 p-4 text-emerald-100 space-y-2">
        <div className="text-sm mb-2 font-semibold">Add learning content</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="px-3 py-1 rounded bg-white text-emerald-900 text-sm border border-emerald-200"
          />
          <input
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Thumbnail URL"
            className="px-3 py-1 rounded bg-white text-emerald-900 text-sm border border-emerald-200"
          />
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Source URL"
            className="px-3 py-1 rounded bg-white text-emerald-900 text-sm border border-emerald-200"
          />
          <select
            value={sourcePlatform}
            onChange={(e) => setSourcePlatform(e.target.value)}
            className="px-3 py-1 rounded bg-white text-emerald-900 text-sm border border-emerald-200"
          >
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="article">Article</option>
            <option value="pdf">PDF</option>
          </select>
          <input
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="Categories (comma separated)"
            className="px-3 py-1 rounded bg-white text-emerald-900 text-sm md:col-span-2 border border-emerald-200"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="px-3 py-1 rounded bg-white text-emerald-900 text-sm md:col-span-2 border border-emerald-200"
          />
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration (e.g. 10:23)"
            className="px-3 py-1 rounded bg-white text-emerald-900 text-sm border border-emerald-200"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author (optional)"
            className="px-3 py-1 rounded bg-white text-emerald-900 text-sm border border-emerald-200"
          />
          <input
            value={publishDate}
            onChange={(e) => setPublishDate(e.target.value)}
            placeholder="Publish date (ISO, optional)"
            className="px-3 py-1 rounded bg-white text-emerald-900 text-sm border border-emerald-200"
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-1 rounded bg-white text-emerald-900 text-sm border border-emerald-200"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={createItem}
            className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
          >
            Create
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl backdrop-blur-xl bg-white/25 border border-white/20"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              className="rounded-2xl backdrop-blur-xl bg-white/20 border border-white/20 p-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
            >
              <div className="flex-1">
                {editingId === it.id ? (
                  <div className="space-y-2 text-xs text-emerald-900">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-1 rounded bg-white/70 text-sm"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-1 rounded bg-white/70 text-sm min-h-20"
                    />
                    <input
                      value={editThumbnailUrl}
                      onChange={(e) => setEditThumbnailUrl(e.target.value)}
                      placeholder="Thumbnail URL"
                      className="w-full px-3 py-1 rounded bg-white/70"
                    />
                    <input
                      value={editSourceUrl}
                      onChange={(e) => setEditSourceUrl(e.target.value)}
                      placeholder="Source URL"
                      className="w-full px-3 py-1 rounded bg-white/70"
                    />
                    <select
                      value={editSourcePlatform}
                      onChange={(e) => setEditSourcePlatform(e.target.value)}
                      className="w-full px-3 py-1 rounded bg-white/70"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                      <option value="article">Article</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <input
                      value={editCategories}
                      onChange={(e) => setEditCategories(e.target.value)}
                      placeholder="Categories (comma separated)"
                      className="w-full px-3 py-1 rounded bg-white/70"
                    />
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags (comma separated)"
                      className="w-full px-3 py-1 rounded bg-white/70"
                    />
                    <input
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      placeholder="Duration"
                      className="w-full px-3 py-1 rounded bg-white/70"
                    />
                    <input
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      placeholder="Author"
                      className="w-full px-3 py-1 rounded bg-white/70"
                    />
                    <input
                      value={editPublishDate}
                      onChange={(e) => setEditPublishDate(e.target.value)}
                      placeholder="Publish date (ISO)"
                      className="w-full px-3 py-1 rounded bg-white/70"
                    />
                    <select
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(e.target.value)}
                      className="w-full px-3 py-1 rounded bg-white/70"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="text-emerald-100 font-semibold text-sm">
                      {it.title}
                    </div>
                    <div className="text-emerald-100/80 text-xs line-clamp-2">
                      {it.description}
                    </div>
                    <div className="mt-1 text-[10px] text-emerald-100/60">
                      {it.sourcePlatform} •
                      {" "}
                      {new Date(it.publishDate).toLocaleDateString()} • {it.difficulty}
                    </div>
                    <div className="mt-1 text-[10px] text-emerald-100/60">
                      Categories: {it.categories.join(", ") || "-"}
                    </div>
                    <div className="mt-1 text-[10px] text-emerald-100/60">
                      Tags: {it.tags.join(", ") || "-"}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                {editingId === it.id ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 rounded bg-emerald-600 text-white text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 rounded bg-white/40 text-xs"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={it.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded bg-white/40 text-xs text-emerald-900"
                    >
                      Open
                    </a>
                    <button
                      onClick={() => startEdit(it)}
                      className="px-3 py-1 rounded bg-white/40 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(it.id)}
                      className="px-3 py-1 rounded bg-red-600 text-white text-xs"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type StationWithInventory = {
  id: string;
  name: string;
  location: string;
  contactPhone?: string | null;
  inventory: Array<{ seedlingType: string; quantityAvailable: number; status: string }>;
};

type StationResponse = { station: StationWithInventory } | null;

function StationsPanel() {
  const [stations, setStations] = useState<StationWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [seedlingType, setSeedlingType] = useState("");
  const [quantityAvailable, setQuantityAvailable] = useState<number>(0);
  const [contactPhone, setContactPhone] = useState("");

  const seedlingTypeOptions = [
    "Grevillea",
    "Blue Gum",
    "Moringa",
    "Avocado",
    "Croton",
    "Mango",
    "Nandi Flame",
  ];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/stations");
      const data = await res.json();
      if (res.ok) setStations(data.stations);
      setLoading(false);
    })();
  }, []);

  const createStation = async () => {
    const initialInventory = seedlingType && quantityAvailable > 0 ? [{ seedlingType, quantityAvailable }] : [];
    const res = await fetch("/api/admin/stations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, location, contactPhone, initialInventory }) });
    let data: StationResponse = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (res.ok && data && data.station) {
      const station: StationWithInventory = data.station;
      setStations((prev) => [station, ...prev]);
    }
    setName("");
    setLocation("");
    setContactPhone("");
    setSeedlingType("");
    setQuantityAvailable(0);
  };

  const startEdit = (s: StationWithInventory) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditLocation(s.location);
    setEditContactPhone(s.contactPhone || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await fetch(`/api/admin/stations/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, location: editLocation, contactPhone: editContactPhone || null }),
    });
    let data: StationResponse = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (res.ok && data && data.station) {
      const updated: StationWithInventory = data.station;
      setStations((prev) => prev.map((st) => (st.id === editingId ? { ...st, ...updated } : st)));
      setEditingId(null);
    }
  };

  const deleteStation = async (id: string) => {
    if (!confirm("Delete this station? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/stations/${id}`, { method: "DELETE" });
    if (res.ok) setStations((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl backdrop-blur-xl bg-white/20 border border-white/20 p-4">
        <div className="text-sm mb-2 text-emerald-100">Add Station</div>
        <div className="flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="px-3 py-1 rounded bg-white/60" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="px-3 py-1 rounded bg-white/60" />
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Contact phone (optional)" className="px-3 py-1 rounded bg-white/60" />
          <select
            value={seedlingType}
            onChange={(e) => setSeedlingType(e.target.value)}
            className="px-3 py-1 rounded bg-white text-emerald-900 border border-emerald-200"
          >
            <option value="">Seedling type (optional)</option>
            {seedlingTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input type="number" min={0} value={quantityAvailable} onChange={(e) => setQuantityAvailable(Number(e.target.value))} placeholder="Quantity (optional)" className="px-3 py-1 rounded bg-white/60 w-40" />
          <button onClick={createStation} className="px-3 py-1 rounded bg-emerald-600 text-white">Create</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl backdrop-blur-xl bg-white/25 border border-white/20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {stations.map((s) => (
            <div key={s.id} className="rounded-2xl backdrop-blur-xl bg-white/20 border border-white/20 p-4">
              {editingId === s.id ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 flex flex-wrap gap-2">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" className="px-3 py-1 rounded bg-white/60" />
                    <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Location" className="px-3 py-1 rounded bg-white/60" />
                    <input value={editContactPhone} onChange={(e) => setEditContactPhone(e.target.value)} placeholder="Contact phone" className="px-3 py-1 rounded bg-white/60" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={saveEdit} className="px-3 py-1 rounded bg-emerald-600 text-white">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded bg-white/40">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-emerald-100 font-semibold">{s.name}</div>
                    <div className="text-emerald-100/80 text-sm">{s.location}</div>
                    {s.contactPhone ? <div className="text-emerald-100/70 text-xs">{s.contactPhone}</div> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(s)} className="px-3 py-1 rounded bg-white/40">Edit</button>
                    <button onClick={() => deleteStation(s.id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                  </div>
                </div>
              )}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(s.inventory ?? []).map((i) => (
                  <div key={i.seedlingType} className="flex items-center justify-between rounded-lg bg-white/20 border border-white/20 p-2">
                    <div className="text-sm text-emerald-100">{i.seedlingType} — {i.quantityAvailable} ({i.status.toLowerCase()})</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
