import React, { useState, useMemo, useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

/* ------------------ Supabase config ------------------ */
const env = (typeof import.meta !== "undefined" && import.meta.env) || {};
const SUPABASE_URL =
  (env.VITE_SUPABASE_URL ||
    "https://zrmfsqjjesqfrkapnmxe.supabase.co").replace(/\/$/, "");
const SUPABASE_ANON =
  env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpybWZzcWpqZXNxZnJrYXBubXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNzA1MDQsImV4cCI6MjA2Mjk0NjUwNH0.KZtlnZEq0bwHRQlTWj344Vl-aw8GjdiM3dMiBnc2VfM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
const qc = new QueryClient();

/* ------------------ Products ------------------ */
function Products() {
  const queryClient = useQueryClient();
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", sku: "", stock: "", price: "" });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        setErr(error.message);
        return [];
      }
      setErr("");
      return data ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase.from("products").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["products"]),
    onError: (e) => setErr(e.message),
  });

  const delMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries(["products"]),
    onError: (e) => setErr(e.message),
  });

  const rows = useMemo(
    () =>
      products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) return;
    addMutation.mutate({
      name: form.name.trim(),
      sku: form.sku.trim(),
      stock: parseInt(form.stock) || 0,
      price: (form.price || "0").toString(),
    });
    setForm({ name: "", sku: "", stock: "", price: "" });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow rounded p-6">
      <form className="grid md:grid-cols-5 gap-4 items-end" onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" required />
        <input name="sku" value={form.sku} onChange={handleChange} placeholder="SKU" className="border p-2 rounded" required />
        <input name="stock" value={form.stock} onChange={handleChange} type="number" min="0" placeholder="Stock" className="border p-2 rounded" />
        <input name="price" value={form.price} onChange={handleChange} type="number" step="0.01" min="0" placeholder="Price" className="border p-2 rounded" />
        <button className="bg-emerald-600 text-white rounded p-2 disabled:opacity-50" disabled={addMutation.isPending}>{addMutation.isPending ? "Saving…" : "Add"}</button>
      </form>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="mt-4 border p-2 w-full rounded" />

      {err && <p className="mt-4 text-red-600">{err}</p>}
      {isLoading ? (
        <p className="mt-4 text-slate-500">Loading…</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-left">
          <thead className="bg-slate-100"><tr><th className="p-3">Name</th><th className="p-3">SKU</th><th className="p-3 text-right">Stock</th><th className="p-3 text-right">Price</th><th className="p-3" /></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="even:bg-slate-50"><td className="p-3">{p.name}</td><td className="p-3">{p.sku}</td><td className="p-3 text-right">{p.stock}</td><td className="p-3 text-right">${Number(p.price).toFixed(2)}</td><td className="p-3 text-right"><button className="text-red-600 hover:underline" disabled={delMutation.isPending} onClick={() => delMutation.mutate(p.id)}>Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ------------------ Shell ------------------ */
function Shell() {
  const [dark, setDark] = useState(() => localStorage.getItem("erpDark") === "1");
  useEffect(() => localStorage.setItem("erpDark", dark ? "1" : "0"), [dark]);
  return (
    <div className={dark ? "dark" : ""}><header className="bg-emerald-600 text-white p-4 flex justify-between"><h1 className="text-xl font-semibold">ERP Demo</h1><button onClick={() => setDark(!dark)} className="px-3 py-1 bg-white/20 rounded">{dark ? "☀︎" : "☾"}</button></header><main className="p-6 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-200 transition-colors"><Products /></main></div>
  );
}

export default function ERPApp() {
  return <QueryClientProvider client={qc}><Shell /></QueryClientProvider>;
}
