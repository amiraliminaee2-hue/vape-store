"use client";

import { useState } from "react";

interface AdminNoteEditorProps {
  orderId: number;
  initialNote: string;
}

export default function AdminNoteEditor({ orderId, initialNote }: AdminNoteEditorProps) {
  const [note, setNote] = useState(initialNote);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: note }),
      });

      if (res.ok) {
        setMessage("✅ ذخیره شد");
        setIsEditing(false);
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage("❌ خطا در ذخیره");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      setMessage("❌ خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <p className="text-zinc-400 text-sm italic">
          {note || "یادداشتی ثبت نشده است"}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-violet-400 hover:text-violet-300"
        >
          ✏️ ویرایش
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="یادداشت ادمین (فقط برای مدیران قابل مشاهده است)..."
        className="
          w-full
          p-3
          rounded-xl
          bg-zinc-900
          border border-white/10
          text-white
          text-sm
          outline-none
          focus:border-violet-500/50
          transition-colors
        "
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm disabled:opacity-50"
        >
          {saving ? "در حال ذخیره..." : "ذخیره"}
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setNote(initialNote);
          }}
          className="px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm"
        >
          انصراف
        </button>
      </div>
      {message && <p className="text-xs text-zinc-400">{message}</p>}
    </div>
  );
}