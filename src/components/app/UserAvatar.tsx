import { useAvatarUrl } from "@/hooks/use-avatar";
import { cn } from "@/lib/utils";

/** صورة المستخدم أينما ظهر حسابه — تعود للحرف الأول إن لم يرفع صورة. */
export function UserAvatar({
  className,
  fallbackClassName,
}: {
  className?: string;
  fallbackClassName?: string;
}) {
  const { url, name } = useAvatarUrl();
  const initial = (name ?? "ع").trim().charAt(0) || "ع";

  if (url) {
    return (
      <img
        src={url}
        alt={`صورة ${name ?? "المستخدم"}`}
        className={cn("size-full rounded-[inherit] object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid size-full place-items-center rounded-[inherit] bg-foreground font-display text-sm font-black text-background",
        fallbackClassName,
        className,
      )}
    >
      {initial}
    </span>
  );
}
