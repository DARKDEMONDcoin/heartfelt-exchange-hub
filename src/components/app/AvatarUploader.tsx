import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;

/** رفع الصورة الشخصية إلى مخزن خاص بكل مستخدم، مع رابط موقّع للعرض. */
export function AvatarUploader({
  userId,
  path,
  name,
  onChange,
  onError,
}: {
  userId: string;
  path: string | null;
  name: string;
  onChange: (nextPath: string | null) => Promise<void> | void;
  onError: (message: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    if (!path) {
      setPreview(null);
      return;
    }
    void supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (alive) setPreview(data?.signedUrl ?? null);
      });
    return () => {
      alive = false;
    };
  }, [path]);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return onError("اختر ملف صورة فقط.");
    if (file.size > MAX_BYTES) return onError("حجم الصورة يجب أن يكون أقل من ٥ ميجابايت.");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const key = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(key, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      if (path) await supabase.storage.from("avatars").remove([path]);
      await onChange(key);
    } catch {
      onError("تعذّر رفع الصورة. أعد المحاولة.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const initials = name.trim().slice(0, 2) || "سه";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative">
        <span className="grid size-20 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-lg font-black">
          {preview ? (
            <img src={preview} alt={`صورة ${name || "المستخدم"}`} className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center text-muted-foreground">
              <UserRound className="size-6" />
              <span className="text-xs font-bold">{initials}</span>
            </span>
          )}
        </span>
        {busy ? (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-background/70">
            <Loader2 className="size-5 animate-spin text-primary" />
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" disabled={busy} onClick={() => input.current?.click()}>
            <Camera className="size-4" />
            {path ? "تغيير الصورة" : "رفع صورة"}
          </Button>
          {path ? (
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await supabase.storage.from("avatars").remove([path]);
                  await onChange(null);
                } catch {
                  onError("تعذّر حذف الصورة.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 className="size-4" />
              حذف
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">PNG أو JPG حتى ٥ ميجابايت. تظهر لك وحدك داخل حسابك.</p>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
