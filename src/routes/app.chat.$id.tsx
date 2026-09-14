import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Check,
  Copy,
  Share2,
  RefreshCw,
  Download,
  PenLine,
  Plus,
  Trash2,
  History,
  X,
  ArrowUpLeft,
  Fingerprint,
  SlidersHorizontal,
  ChevronDown,
  BookOpenText,
  AudioLines,
  PlugZap,
  ImagePlus,
  TextCursorInput,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { AppIcon, appLabel } from "@/components/site/AppIcon";
import { ConnectNow } from "@/components/app/ConnectNow";
import { getMember } from "@/data/team";
import {
  useBrainItems,
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useIntegrations,
  useMessages,
  useProfile,
  useRenameConversation,
  useWorkspace,
} from "@/lib/data";
import { SiteBadgeBar } from "@/components/app/SiteBadge";
import { askEmployee, runSkill } from "@/lib/ai.functions";
import { SkillPalette } from "@/components/app/SkillPalette";
import { Thinking } from "@/components/app/Thinking";
import { Markdown } from "@/components/app/Markdown";
import { PublishPanel } from "@/components/app/PublishPanel";
import { requestedPublishTargets } from "@/lib/platforms";
import { isNonPostReply } from "@/lib/post-format";
import { detectHandoff } from "@/lib/handoff";
import { HandoffCard } from "@/components/app/HandoffCard";
import { PublishToWordPress } from "@/components/app/PublishToWordPress";
import { ActionPanel } from "@/components/app/ActionPanel";
import { UserAvatar } from "@/components/app/UserAvatar";
import { Portrait } from "@/components/site/Portrait";
import {
  MediaStudio,
  type Attachment,
  type ImageMode,
  type Aspect,
} from "@/components/app/MediaStudio";

import { featuredSkillsFor, skillsFor, type Skill } from "@/data/skills";
import { cn } from "@/lib/utils";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

/** يقسّم الرسائل حسب اليوم لعرض فواصل تاريخ أنيقة. */
function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "اليوم";
  if (same(d, yesterday)) return "أمس";
  return d.toLocaleDateString("ar", { weekday: "long", day: "numeric", month: "long" });
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* تجاهل */
        }
      }}
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.7rem] font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      aria-label="نسخ الرد"
    >
      {done ? <Check className="size-3 text-jade" /> : <Copy className="size-3" />}
      {done ? "نُسخ" : "نسخ"}
    </button>
  );
}

/** أزرار أسفل رد الموظف: نسخ · مشاركة · تنزيل · تعديل في المربع · إعادة التوليد. */
function MessageActions({
  text,
  onEdit,
  onRegenerate,
  disabled,
}: {
  text: string;
  onEdit: () => void;
  onRegenerate: (() => void) | null;
  disabled: boolean;
}) {
  const [shared, setShared] = useState(false);
  const btn =
    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.7rem] font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50";
  const share = async () => {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 1600);
      }
    } catch {
      /* أُلغيت المشاركة */
    }
  };
  const download = () => {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sahl-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <span className="flex flex-wrap items-center gap-0.5">
      <CopyButton text={text} />
      <button type="button" onClick={() => void share()} className={btn} aria-label="مشاركة">
        <Share2 className="size-3" /> {shared ? "نُسخ للمشاركة" : "مشاركة"}
      </button>
      <button type="button" onClick={download} className={btn} aria-label="تنزيل">
        <Download className="size-3" /> تنزيل
      </button>
      <button type="button" onClick={onEdit} className={btn} aria-label="تعديل يدوي">
        <PenLine className="size-3" /> عدّل
      </button>
      {onRegenerate ? (
        <button
          type="button"
          onClick={onRegenerate}
          disabled={disabled}
          className={btn}
          aria-label="إعادة التوليد"
        >
          <RefreshCw className="size-3" /> أعد التوليد
        </button>
      ) : null}
    </span>
  );
}

/** آخر رسالة كتبها المستخدم قبل رد الموظف — لنعرف ما طلبه بالضبط (المنصة مثلاً). */
function lastUserBefore(arr: { role: string; body: string }[], idx: number): string {
  for (let i = idx - 1; i >= 0; i -= 1) {
    const m = arr[i];
    if (m && m.role === "user") return m.body;
  }
  return "";
}

/** يقرّر إن كان رد سِراج منشوراً قابلاً للنشر (لا سؤالاً ولا شرحاً قصيراً). */
function looksPostable(body: string): boolean {
  const text = body.trim();
  if (text.length < 80) return false;
  if (/^[^\n]{0,200}\?\s*$/.test(text)) return false;
  if (isNonPostReply(text)) return false;
  return /#[^\s#]{2,}/.test(text) || text.length > 220;
}

export const Route = createFileRoute("/app/chat/$id")({
  validateSearch: (s: Record<string, unknown>): { prompt?: string } =>
    typeof s["prompt"] === "string" && s["prompt"] ? { prompt: s["prompt"].slice(0, 4000) } : {},
  loader: ({ params }) => {
    const member = getMember(params.id);
    if (!member) throw notFound();
    return { name: member.name, role: member.role };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `محادثة ${loaderData.name} | سهل` : "محادثة | سهل" },
      {
        name: "description",
        content: loaderData ? `تحدث مع ${loaderData.name} — ${loaderData.role}.` : "محادثة الموظف.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: () => <ChatMissing />,
  notFoundComponent: () => <ChatMissing />,
  component: ChatPage,
});

function ChatMissing() {
  return (
    <AppShell title="الموظف غير موجود">
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <p className="text-ink-soft">لم نعثر على هذا الموظف ضمن فريقك.</p>
        <Link
          to="/app/chat"
          className="mt-5 inline-block rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background"
        >
          العودة للمحادثات
        </Link>
      </div>
    </AppShell>
  );
}

/** عناوين عربية لمفاتيح JSON عند عرض رد قديم بصيغة غير متوقعة. */
const JSON_LABELS: Record<string, string> = {
  day: "اليوم",
  title: "العنوان",
  content_pillar: "محور المحتوى",
  channel: "المنصة",
  body: "النص",
  caption: "النص",
  hashtags: "الهاشتاجات",
  scheduled: "موعد النشر",
  best_time: "أفضل وقت",
  metrics_to_measure: "مؤشرات القياس",
  call_to_action: "دعوة لاتخاذ إجراء",
  instagram_post: "منشور إنستجرام",
  x_post: "تغريدة إكس",
  linkedin_post: "منشور لينكدإن",
  facebook_post: "منشور فيسبوك",
};
const JSON_HIDDEN = new Set(["image_prompt", "needs_connection", "kind", "provider", "reason"]);

/** يحوّل أي بنية JSON إلى نص عربي مقروء بدل عرض أقواس ومفاتيح. */
function jsonToText(node: unknown, depth = 0): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node.replace(/\\n/g, "\n").trim();
  if (typeof node === "number" || typeof node === "boolean") return String(node);
  if (Array.isArray(node))
    return node
      .map((v) => {
        const r = jsonToText(v, depth + 1);
        return r && typeof v !== "object" ? `- ${r}` : r;
      })
      .filter(Boolean)
      .join(depth === 0 ? "\n\n---\n\n" : "\n");
  if (typeof node === "object")
    return Object.entries(node as Record<string, unknown>)
      .filter(([k, v]) => !JSON_HIDDEN.has(k) && v !== null && v !== undefined && v !== "")
      .map(([k, v]) => {
        const r = jsonToText(v, depth + 1);
        if (!r) return "";
        const label = JSON_LABELS[k] ?? k.replace(/_/g, " ");
        if (typeof v === "object") return `${"#".repeat(Math.min(depth + 2, 6))} ${label}\n\n${r}`;
        return r.includes("\n") ? `**${label}:**\n\n${r}` : `**${label}:** ${r}`;
      })
      .filter(Boolean)
      .join("\n\n");
  return "";
}

/** بعض الردود القديمة محفوظة كنص JSON خام — نحوّلها لعرض مقروء. */
/** يفصل بادئة JSON عن أي نص أُلحق بها (صورة، مصادر) في الردود القديمة. */
function splitJsonPrefix(text: string): { parsed: unknown; rest: string } | null {
  const open = text[0];
  if (open !== "{" && open !== "[") return null;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === "\\") {
      esc = true;
      continue;
    }
    if (ch === '"') inStr = !inStr;
    if (inStr) continue;
    if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) {
        try {
          return { parsed: JSON.parse(text.slice(0, i + 1)), rest: text.slice(i + 1).trim() };
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function prettyBody(body: string): string {
  const text = body.trim();
  if (!text.startsWith("{") && !text.startsWith("[")) return body;
  try {
    const split = splitJsonPrefix(text);
    if (!split) throw new Error("not json");
    const { parsed, rest } = split;
    const tail = rest ? `\n\n${rest}` : "";
    const items = (Array.isArray(parsed) ? parsed : [parsed]) as Array<{
      reply?: string;
      deliverable?: { title?: string; body?: string } | null;
      deliverables?: Array<{ title?: string; body?: string }> | null;
    }>;
    const parts = items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const chunk: string[] = [];
      if (typeof item.reply === "string" && item.reply.trim()) chunk.push(item.reply.trim());
      for (const d of [
        item.deliverable,
        ...(Array.isArray(item.deliverables) ? item.deliverables : []),
      ])
        if (d?.body) chunk.push(`### ${d.title ?? "المخرج"}\n\n${d.body}`);
      return chunk;
    });
    if (parts.length) return parts.join("\n\n") + tail;
    const readable = jsonToText(parsed);
    return readable.trim().length > 20 ? readable + tail : body;
  } catch {
    return body;
  }
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
}

const EMPLOYEE_COPY: Record<string, { prompts: string[]; greetings: string[] }> = {
  sonny: {
    prompts: [
      "اكتب حملة إطلاق كاملة لمنتجي…",
      "حضّر تقويم محتوى للشهر القادم…",
      "حوّل هذه الفكرة إلى منشور جذّاب…",
      "راجع أداء حساباتي واقترح الخطوة التالية…",
    ],
    greetings: [
      "جاهز نحوّل فكرتك إلى حضور يستحق التوقف عنده.",
      "خلّينا نبني محتوى يبدو منك، لا من آلة.",
      "من أول الفكرة حتى النشر، أنا معك.",
      "قل لي هدفك، وسأرتّب الطريق الأقصر إليه.",
    ],
  },
  eva: {
    prompts: [
      "رتّبي أولويات يومي ورسائلي…",
      "حضّري ردًا مهنيًا على هذا البريد…",
      "نسّقي موعدًا يناسب الجميع…",
      "لخّصي ما يحتاج قراري اليوم…",
    ],
    greetings: [
      "سأحمي وقتك وأرتّب ما يستحق انتباهك أولًا.",
      "اترك التفاصيل لي واحتفظ أنت بالقرارات المهمة.",
      "يوم أهدأ يبدأ من قائمة مرتبة بوضوح.",
      "أنا هنا لأجعل كل شيء في موعده ومكانه.",
    ],
  },
  sam: {
    prompts: [
      "ابحث عن أفضل العملاء لهذا العرض…",
      "اكتب رسالة تواصل شخصية لهذا العميل…",
      "رتّب متابعة الفرص المفتوحة…",
      "حلّل خط المبيعات وحدد الأولوية…",
    ],
    greetings: [
      "لنبحث عن الفرص التي تستحق وقت فريقك فعلًا.",
      "كل رسالة ستبدو شخصية وواضحة، لا آلية.",
      "سأتابع بهدوء حتى تصبح الفرصة محادثة حقيقية.",
      "ابدأ بالهدف، وسأبني لك طريق الوصول للعميل.",
    ],
  },
  nour: {
    prompts: [
      "ابحث عن أفضل فرصة محتوى لموقعي…",
      "اكتب مقالًا عربيًا يتصدر البحث…",
      "راجع هذه الصفحة وحدد مشاكل السيو…",
      "ابنِ خريطة محتوى للموضوع بالكامل…",
    ],
    greetings: [
      "سنكتب للناس أولًا، ثم نجعل محركات البحث تفهمنا.",
      "كل كلمة سنختارها لها سبب ونتيجة قابلة للقياس.",
      "لنحوّل ما يبحث عنه جمهورك إلى محتوى يجدونه فعلًا.",
      "أنا جاهزة لبناء حضور يبقى، لا زيارة عابرة.",
    ],
  },
  dana: {
    prompts: [
      "صمّمي هوية بصرية لهذه الفكرة…",
      "حوّلي هذا العرض إلى إعلان جذّاب…",
      "أنشئي مجموعة تصاميم لكل المنصات…",
      "راجعي هذا التصميم وطوّريه…",
    ],
    greetings: [
      "لنحوّل فكرتك إلى شيء يُرى ويُتذكر.",
      "الجمال هنا ليس زينة؛ بل وضوح وثقة.",
      "سأحافظ على روح علامتك في كل مقاس وتفصيلة.",
      "ابدأ بالإحساس الذي تريده، وسأمنحه شكلًا.",
    ],
  },
  adam: {
    prompts: [
      "حلّل أداء القنوات هذا الشهر…",
      "أين نهدر الميزانية الآن؟…",
      "حوّل هذه الأرقام إلى قرارات واضحة…",
      "قارن النتائج وحدد ما يجب مضاعفته…",
    ],
    greetings: [
      "سأفصل الإشارة عن الضوضاء وأعطيك القرار الواضح.",
      "الأرقام تحكي قصة؛ دوري أن أجعلها مفهومة.",
      "لن ننظر إلى التقارير فقط، بل إلى الخطوة التالية.",
      "دعنا نعرف ما يعمل فعلًا وما يجب أن يتوقف.",
    ],
  },
};

function useTypewriter(lines: string[], pause = 1700) {
  const [line, setLine] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLength(lines[0]?.length ?? 0);
      return;
    }
    const current = lines[line] ?? "";
    const complete = length === current.length;
    const empty = length === 0;
    const delay = complete && !deleting ? pause : deleting ? 28 : 52;
    const timer = window.setTimeout(() => {
      if (complete && !deleting) setDeleting(true);
      else if (empty && deleting) {
        setDeleting(false);
        setLine((value) => (value + 1) % lines.length);
      } else setLength((value) => value + (deleting ? -1 : 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [deleting, length, line, lines, pause]);

  return lines[line]?.slice(0, length) ?? "";
}

/** منتقي المحادثات داخل الشريط الثابت: تبديل · تسمية · حذف · محادثة جديدة. */
function ThreadPicker({
  conversations,
  conversationId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  creating,
}: {
  conversations: { id: string; title: string }[];
  conversationId: string | undefined;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  creating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = conversations.find((c) => c.id === conversationId);

  return (
    <div className="chat-thread-picker" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="المحادثات"
        title="محادثات هذا الموظف"
        className="chat-thread-trigger"
      >
        <History className="size-3.5 shrink-0" />
        <span>{active?.title ?? "محادثة جديدة"}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="chat-thread-menu" role="menu">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
            <p className="text-[0.68rem] font-bold text-muted-foreground">المحادثات</p>
            <button
              type="button"
              onClick={onCreate}
              disabled={creating}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[0.68rem] font-bold transition-colors hover:bg-secondary disabled:opacity-50"
            >
              {creating ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
              جديدة
            </button>
          </div>
          <div className="chat-thread-menu-list">
            {conversations.length ? (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "chat-thread-row group",
                    conversation.id === conversationId && "is-active",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(conversation.id);
                      setOpen(false);
                    }}
                    onDoubleClick={() => {
                      const title = window.prompt("اسم المحادثة", conversation.title)?.trim();
                      if (title) onRename(conversation.id, title);
                    }}
                    className="min-w-0 flex-1 truncate px-2 py-2 text-start text-[0.78rem] font-semibold"
                    title="انقر مرتين لإعادة التسمية"
                  >
                    {conversation.title}
                  </button>
                  <button
                    type="button"
                    aria-label="حذف المحادثة"
                    title="حذف المحادثة"
                    onClick={() => {
                      if (window.confirm("حذف هذه المحادثة ورسائلها؟")) onDelete(conversation.id);
                    }}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-coral/10 hover:text-coral group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                لا توجد محادثات بعد.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChatPage() {
  const { id } = Route.useParams();
  const member = getMember(id)!;
  const qc = useQueryClient();
  const { data: workspace } = useWorkspace();
  const { data: profile } = useProfile();
  const { data: conversations } = useConversations(workspace?.id, id);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const createConversation = useCreateConversation(workspace?.id, id);
  const renameConversation = useRenameConversation(workspace?.id, id);
  const deleteConversation = useDeleteConversation(workspace?.id, id);
  const { data: messages } = useMessages(workspace?.id, id, conversationId);
  const { data: integrations } = useIntegrations(workspace?.id);
  const { data: brainItems } = useBrainItems(workspace?.id);
  const hasVoiceGuide = (brainItems ?? []).some((b) => b.title === "دليل صوت العلامة");
  const { prompt: prefill } = Route.useSearch();
  const [draft, setDraft] = useState(prefill ?? "");
  useEffect(() => {
    if (prefill) setDraft(prefill);
  }, [prefill]);
  const [pending, setPending] = useState<string | null>(null);
  const [savedTask, setSavedTask] = useState(false);
  /** طلب ربط سياقي: يظهر فقط عندما تحتاج المهمة الحالية حساباً غير مربوط. */
  const [needsConnection, setNeedsConnection] = useState<{
    provider: string;
    reason: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  // حرية الوسائط: مرفقات المستخدم + قراره في الصورة التلقائية + نسبة الأبعاد.
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [imageMode, setImageMode] = useState<ImageMode>("auto");
  const [imagePrompt, setImagePrompt] = useState("");
  const [aspect, setAspect] = useState<Aspect>("square");
  /** طول المنشور: اختياري تماماً — الافتراضي «تلقائي» يترك القرار للموظف. */
  const [postLength, setPostLength] = useState<"auto" | "short" | "medium" | "long">("auto");

  useEffect(() => {
    if (!conversationId && conversations?.[0]) setConversationId(conversations[0].id);
    if (conversationId && conversations && !conversations.some((c) => c.id === conversationId)) {
      setConversationId(conversations[0]?.id);
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    if (
      !workspace ||
      conversations === undefined ||
      conversations.length > 0 ||
      createConversation.isPending
    )
      return;
    createConversation.mutate(undefined, { onSuccess: (row) => setConversationId(row.id) });
  }, [workspace, conversations, createConversation]);

  const [showSettings, setShowSettings] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<"media" | "length" | null>(null);
  /** تلميح صوت العلامة اختياري تماماً — يُخفى نهائياً بضغطة واحدة. */
  const [voiceHintHidden, setVoiceHintHidden] = useState(true);
  useEffect(() => {
    setVoiceHintHidden(localStorage.getItem("sahl:voice-hint-hidden") === "1");
  }, []);
  const dismissVoiceHint = () => {
    localStorage.setItem("sahl:voice-hint-hidden", "1");
    setVoiceHintHidden(true);
  };

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ask = useServerFn(askEmployee);
  const runSkillFn = useServerFn(runSkill);
  const employeeSkills = skillsFor(id);
  const quickSkills = featuredSkillsFor(id).slice(0, 6);
  const employeeCopy: { prompts: string[]; greetings: string[] } =
    EMPLOYEE_COPY[id] ?? EMPLOYEE_COPY["sonny"]!;
  const rotatingPlaceholder = useTypewriter(employeeCopy.prompts);
  const rotatingGreeting = useTypewriter(employeeCopy.greetings, 2400);
  const userName = profile?.full_name?.trim().split(/\s+/)[0] || "صديقي";
  /** آخر رسالة فشل إرسالها — لزر «أعد المحاولة». */
  const [pendingText, setPendingText] = useState<string | null>(null);

  const owned = (integrations ?? []).filter((i) => i.employee_id === id);
  const wpConnected = (integrations ?? []).some(
    (i) => i.provider === "wordpress" && i.status === "connected",
  );

  const send = useMutation({
    mutationFn: (message: string) =>
      ask({
        data: {
          workspaceId: workspace!.id,
          employeeId: id,
          conversationId: conversationId!,
          message,
          attachments,
          imageMode,
          imagePrompt: imagePrompt.trim() || undefined,
          imageAspect: aspect,
          postLength,
        },
      }),

    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["messages", workspace?.id, id, conversationId] });
      setPending(null);
      setPendingText(null);
      // المرفقات ووصف الصورة يخصّان الرسالة المُرسلة فقط.
      setAttachments([]);
      setImagePrompt("");

      setSavedTask(Boolean(res?.createdTaskId));
      setNeedsConnection(res?.needsConnection ?? null);
      void qc.invalidateQueries({ queryKey: ["messages-last", workspace?.id] });
      void qc.invalidateQueries({ queryKey: ["conversations", workspace?.id, id] });
      void qc.invalidateQueries({ queryKey: ["tasks", workspace?.id] });
    },
    onError: (e: unknown, message) => {
      setPending(null);
      setPendingText(message);
      setError(e instanceof Error ? e.message : "تعذّر إرسال الطلب");
    },
  });

  const skillRun = useMutation({
    mutationFn: (p: { skill: Skill; values: Record<string, string> }) =>
      runSkillFn({
        data: {
          workspaceId: workspace!.id,
          employeeId: id,
          skillId: p.skill.id,
          values: p.values,
          conversationId: conversationId!,
        },
      }),
    onSuccess: (res) => {
      setSavedTask(Boolean(res?.taskId));
      void qc.invalidateQueries({ queryKey: ["messages", workspace?.id, id, conversationId] });
      void qc.invalidateQueries({ queryKey: ["messages-last", workspace?.id] });
      void qc.invalidateQueries({ queryKey: ["tasks", workspace?.id] });
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "تعذّر تنفيذ المهمة"),
  });

  const busy = send.isPending || skillRun.isPending;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length, send.isPending, skillRun.isPending]);

  // إبقاء التركيز في مربع الكتابة + تمدد تلقائي لارتفاع النص.
  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy, id]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const submit = (text: string) => {
    const body = text.trim();
    if (!body || !workspace || !conversationId || busy) return;
    setError(null);
    setSavedTask(false);

    setDraft("");
    setPending(body);
    send.mutate(body);
  };

  return (
    <AppShell
      title={member.name}
      lead={member.role}
      padded={false}
      actions={
        <>
          <button
            type="button"
            onClick={() =>
              createConversation.mutate(undefined, {
                onSuccess: (row) => setConversationId(row.id),
              })
            }
            disabled={!workspace || createConversation.isPending}
            className="grid size-10 place-items-center rounded-xl border border-border transition-colors hover:bg-secondary disabled:opacity-50"
            aria-label="محادثة جديدة"
            title="محادثة جديدة"
          >
            {createConversation.isPending ? (
              <Loader2 className="size-4.5 animate-spin" />
            ) : (
              <Plus className="size-4.5" />
            )}
          </button>
        </>
      }
    >
      <div className="chat-command-layout">
        <div
          className="chat-stage relative flex min-h-[calc(100dvh-4rem)] min-w-0 flex-col"
          style={
            {
              "--chat-accent": member.tint,
              "--chat-accent-soft": member.tintSoft,
            } as React.CSSProperties
          }
        >
          <div className="chat-smoke" aria-hidden="true">
            <i />
            <i />
            <i />
            <b />
            <b />
            <b />
          </div>
          <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 sm:px-6">
            <SiteBadgeBar
              website={(workspace as { website?: string | null } | undefined)?.website ?? null}
            />
            <section className="employee-command-bar" aria-label={`مساحة عمل ${member.name}`}>
              <div className="employee-command-identity">
                <span className="relative block size-9 shrink-0 overflow-hidden rounded-lg">
                  <Portrait memberId={member.id} name={member.name} className="size-full" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black">{member.name}</span>
                  <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-primary">
                    <span className="chat-live-dot size-1.5 rounded-full bg-primary" /> متصل
                  </span>
                </span>
              </div>
              <div className="employee-command-skills">
                <SkillPalette
                  skills={employeeSkills}
                  quick={quickSkills}
                  disabled={!workspace}
                  pending={busy}
                  onRun={(skill, values) => {
                    setError(null);
                    skillRun.mutate({ skill, values });
                  }}
                />
              </div>
              <Link
                to="/app/brain"
                className="employee-command-link"
                title="المصادر التي يقرأها الموظف"
              >
                <BookOpenText className="size-3.5" />
                <span>عقل العلامة</span>
              </Link>
              <Link to="/app/brain" className="employee-command-link" title="نبرة وأسلوب علامتك">
                <AudioLines className="size-3.5" />
                <span>صوت العلامة</span>
              </Link>
              <Link
                to="/app/integrations"
                className="employee-command-link"
                title="حسابات الموظف المرتبطة"
              >
                <PlugZap className="size-3.5" />
                <span>التكاملات</span>
              </Link>
              {owned.length ? (
                <div className="employee-command-apps" aria-label="التطبيقات المتاحة">
                  {owned.slice(0, 5).map((integration) => (
                    <span key={integration.id} title={appLabel(integration.provider)}>
                      <AppIcon name={integration.provider} className="size-5" />
                    </span>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setShowSettings((value) => !value)}
                aria-expanded={showSettings}
                aria-label="المحادثات والتنفيذ"
                title="المحادثات والتنفيذ"
                className={cn("employee-command-history", showSettings && "is-active")}
              >
                <History className="size-4" />
                <span>المحادثات</span>
              </button>
            </section>
            {brainItems &&
            !hasVoiceGuide &&
            !voiceHintHidden &&
            ["sonny", "nour", "eva", "dana"].includes(id) ? (
              <div className="group flex items-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-sm">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-primary-foreground"
                  style={{ backgroundImage: "var(--gradient-aurora)" }}
                >
                  <Fingerprint className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">
                    اختياري: خلّي {member.name} يكتب بصوت علامتك
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    يعمل بكفاءة كاملة بدونها — وإن أردت دقة أعلى الصق رابط موقعك مرة واحدة في عقل
                    العلامة.
                  </span>
                </span>
                <Link
                  to="/app/brain"
                  className="hidden shrink-0 items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:bg-secondary sm:inline-flex"
                >
                  فعّلها <ArrowUpLeft className="size-3.5 text-primary" />
                </Link>
                <button
                  type="button"
                  aria-label="إخفاء"
                  title="إخفاء"
                  onClick={dismissVoiceHint}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : null}

            {(messages ?? []).length === 0 && !pending ? (
              <div className="chat-welcome animate-pop-in">
                <div className="chat-welcome-portraits" aria-hidden="true">
                  <span className="chat-welcome-avatar is-user">
                    <UserAvatar />
                  </span>
                  <span className="chat-welcome-avatar is-employee">
                    <Portrait memberId={member.id} name={member.name} className="size-full" />
                  </span>
                </div>
                <p className="chat-welcome-eyebrow">
                  أنا {member.name}، {member.role}
                </p>
                <h2>أهلًا {userName}</h2>
                <p className="chat-welcome-rotating" aria-live="polite">
                  {rotatingGreeting}
                  <span className="typewriter-caret" aria-hidden="true" />
                </p>
                <p className="chat-welcome-tagline">{member.tagline}</p>
              </div>
            ) : null}

            {(messages ?? []).map((m, idx, arr) => {
              const prev = arr[idx - 1];
              const newDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at);
              const isUser = m.role === "user";
              const body = isUser ? m.body : prettyBody(m.body);
              return (
                <div key={m.id} className="space-y-4">
                  {newDay ? (
                    <div className="flex items-center gap-3 py-1 text-[0.7rem] font-bold text-muted-foreground">
                      <span className="h-px flex-1 bg-border" />
                      {dayLabel(m.created_at)}
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  ) : null}
                  <Message
                    from={isUser ? "user" : "assistant"}
                    className={cn("animate-bubble-in", isUser ? "ms-0 me-auto" : "ms-auto me-0")}
                  >
                    <div
                      className={cn("group flex gap-3", isUser ? "justify-start" : "justify-end")}
                    >
                      {!isUser ? (
                        <span className="relative order-2 mt-1 block size-9 shrink-0 overflow-hidden rounded-xl shadow-sm">
                          <Portrait memberId={member.id} name={member.name} className="size-full" />
                        </span>
                      ) : null}
                      <MessageContent
                        className={cn(
                          "min-w-0 max-w-[min(46rem,82%)] px-4 py-3 text-sm leading-7",
                          isUser
                            ? "bubble-user rounded-xl rounded-ss-sm text-primary-foreground whitespace-pre-wrap shadow-card"
                            : "order-1 bg-transparent",
                        )}
                      >
                        {isUser ? <p dir="auto">{m.body}</p> : <Markdown body={body} />}
                        {!isUser && id === "nour" && workspace && m.body.length > 600 ? (
                          wpConnected ? (
                            <PublishToWordPress workspaceId={workspace.id} body={m.body} />
                          ) : (
                            <span className="mt-3 inline-flex">
                              <ConnectNow
                                workspaceId={workspace.id}
                                provider="wordpress"
                                size="sm"
                                label="اربط ووردبريس وانشر المقال"
                              />
                            </span>
                          )
                        ) : null}
                        {!isUser &&
                        id === "sonny" &&
                        workspace &&
                        !m.body.includes("(/app/tasks)") &&
                        looksPostable(m.body) ? (
                          <PublishPanel
                            workspaceId={workspace.id}
                            employeeId="sonny"
                            channel={
                              requestedPublishTargets(lastUserBefore(arr, idx))[0] ?? "instagram"
                            }
                            request={lastUserBefore(arr, idx)}
                            body={m.body}
                          />
                        ) : null}

                        {!isUser
                          ? (() => {
                              const req = lastUserBefore(arr, idx);
                              const handoff = detectHandoff(req, id);
                              return handoff ? (
                                <HandoffCard
                                  handoff={handoff}
                                  request={req}
                                  currentName={member.name}
                                />
                              ) : null;
                            })()
                          : null}

                        <div
                          className={cn(
                            "mt-1.5 flex items-center gap-2 text-[0.7rem]",
                            isUser ? "text-background/60" : "text-muted-foreground",
                          )}
                        >
                          <span>{timeOf(m.created_at)}</span>
                          {!isUser ? (
                            <span className="ms-auto opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                              <MessageActions
                                text={body}
                                disabled={busy}
                                onEdit={() => {
                                  setDraft(body);
                                  inputRef.current?.focus();
                                }}
                                onRegenerate={
                                  lastUserBefore(arr, idx)
                                    ? () =>
                                        submit(
                                          `${lastUserBefore(arr, idx)}\n\n(أعد صياغة الرد السابق بزاوية مختلفة وأقوى، وحافظ على نفس الطلب.)`,
                                        )
                                    : null
                                }
                              />
                            </span>
                          ) : null}
                        </div>
                      </MessageContent>
                    </div>
                  </Message>
                </div>
              );
            })}

            {pending ? (
              <div className="flex justify-start gap-3 animate-bubble-in">
                <div className="bubble-user min-w-0 max-w-[min(46rem,88%)] rounded-3xl rounded-ss-lg px-5 py-3.5 leading-relaxed text-background shadow-card">
                  <p dir="auto" className="whitespace-pre-wrap">
                    {pending}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[0.7rem] text-background/60">
                    <Check className="size-3" /> وصل إلى {member.name}
                  </p>
                </div>
              </div>
            ) : null}

            {busy ? (
              <Thinking
                memberId={member.id}
                name={member.name}
                request={pending ?? pendingText ?? ""}
                imageRequested={
                  imageMode !== "off" && (imageMode !== "auto" || Boolean(imagePrompt.trim()))
                }
                attachments={attachments.length}
              />
            ) : null}

            {savedTask && !busy ? (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-jade/25 bg-jade/10 px-4 py-3 text-sm font-semibold text-jade-deep animate-pop-in">
                <span className="grid size-7 place-items-center rounded-full bg-jade text-background">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                تم حفظ المخرج في «الموافقات» بانتظار اعتمادك.
                <Link
                  to="/app/approvals"
                  className="ms-auto rounded-full bg-jade-deep px-4 py-1.5 text-xs font-bold text-background transition-transform hover:-translate-y-0.5"
                >
                  افتح الموافقات
                </Link>
              </div>
            ) : null}

            {needsConnection && !busy ? (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky/30 bg-sky/10 px-4 py-3 text-sm font-semibold animate-pop-in">
                <AppIcon name={needsConnection.provider} className="size-6 shrink-0" />
                <span className="min-w-0 flex-1">
                  لتنفيذ هذه المهمة فعلياً يحتاج {member.name} ربط{" "}
                  <b>{appLabel(needsConnection.provider)}</b>
                  {needsConnection.reason ? ` — ${needsConnection.reason}` : ""}. دقيقة واحدة عبر
                  OAuth الرسمي.
                </span>
                <ConnectNow
                  workspaceId={workspace?.id}
                  provider={needsConnection.provider}
                  size="sm"
                />
                <button
                  onClick={() => setNeedsConnection(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  لاحقاً
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-semibold text-coral animate-pop-in">
                <span className="flex-1">{error}</span>
                {pendingText ? (
                  <button
                    type="button"
                    onClick={() => submit(pendingText)}
                    className="rounded-full bg-coral px-4 py-1.5 text-xs font-bold text-background"
                  >
                    أعد المحاولة
                  </button>
                ) : null}
              </div>
            ) : null}

            <div ref={endRef} />
          </div>

          <div className="chat-composer-dock pointer-events-none sticky bottom-0 z-20 mt-auto p-3 sm:p-5">
            <PromptInput
              onSubmit={(message) => submit(message.text || draft)}
              className="chat-composer pointer-events-auto mx-auto max-w-4xl rounded-2xl border border-border/70 p-2 transition-all focus-within:border-primary/55 focus-within:ring-4 focus-within:ring-primary/10"
            >
              <PromptInputTextarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  rotatingPlaceholder ? `${rotatingPlaceholder}▌` : `اكتب طلبك لـ${member.name}…`
                }
                dir="auto"
                className="max-h-40 min-h-12 bg-transparent px-3 py-2.5 placeholder:text-muted-foreground/80"
              />
              {toolsOpen ? (
                <div className="chat-tool-launcher animate-fade-in" aria-label="أدوات الطلب">
                  <button
                    type="button"
                    onClick={() => setActiveTool((value) => (value === "media" ? null : "media"))}
                    className={cn("chat-tool-choice", activeTool === "media" && "is-active")}
                    aria-expanded={activeTool === "media"}
                  >
                    <ImagePlus className="size-4" /> الوسائط
                    {attachments.length ? <span>{attachments.length}</span> : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool((value) => (value === "length" ? null : "length"))}
                    className={cn("chat-tool-choice", activeTool === "length" && "is-active")}
                    aria-expanded={activeTool === "length"}
                  >
                    <TextCursorInput className="size-4" /> الطول
                  </button>
                </div>
              ) : null}
              {activeTool ? (
                <div className="chat-tool-popover animate-pop-in">
                  <div className="chat-tool-popover-head">
                    <div>
                      <p>{activeTool === "media" ? "الوسائط" : "طول المحتوى"}</p>
                      <span>
                        {activeTool === "media"
                          ? "أرفق أو أنشئ ما يحتاجه الطلب"
                          : "اختر الحجم الأنسب لهذه النتيجة"}
                      </span>
                    </div>
                    <button type="button" onClick={() => setActiveTool(null)} aria-label="إغلاق">
                      <X className="size-4" />
                    </button>
                  </div>
                  {activeTool === "media" ? (
                    <MediaStudio
                      workspaceId={workspace?.id}
                      attachments={attachments}
                      onAttachmentsChange={setAttachments}
                      imageMode={imageMode}
                      onImageModeChange={setImageMode}
                      imagePrompt={imagePrompt}
                      onImagePromptChange={setImagePrompt}
                      aspect={aspect}
                      onAspectChange={setAspect}
                      disabled={busy}
                      defaultOpen
                      hideTrigger
                    />
                  ) : (
                    <div className="chat-length-options">
                      {(
                        [
                          ["auto", "تلقائي", "يقرر الموظف الأنسب"],
                          ["short", "قصير", "مباشر وسريع"],
                          ["medium", "متوسط", "متوازن ومفصل"],
                          ["long", "مطوّل", "شامل ومتعمق"],
                        ] as const
                      ).map(([value, label, hint]) => (
                        <button
                          key={value}
                          type="button"
                          disabled={busy}
                          onClick={() => setPostLength(value)}
                          className={cn("chat-length-option", postLength === value && "is-active")}
                        >
                          <span>{label}</span>
                          <small>{hint}</small>
                          {postLength === value ? <Check className="size-4" /> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputButton
                    type="button"
                    onClick={() => {
                      setToolsOpen((value) => {
                        if (value) setActiveTool(null);
                        return !value;
                      });
                    }}
                    aria-expanded={toolsOpen}
                    aria-label="أدوات الطلب"
                    title="الوسائط وإعدادات الطلب"
                    className={cn("size-9 rounded-lg", toolsOpen && "bg-primary/10 text-primary")}
                  >
                    <SlidersHorizontal className="size-4.5" />
                  </PromptInputButton>
                </PromptInputTools>
                <PromptInputSubmit
                  {...(busy ? { status: "submitted" as const } : {})}
                  disabled={busy || !workspace || !draft.trim()}
                  aria-label="إرسال"
                  className="size-9 rounded-lg"
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>

        {showSettings ? (
          <button
            type="button"
            aria-label="إغلاق لوحة المحادثات"
            onClick={() => setShowSettings(false)}
            className="chat-thread-backdrop"
          />
        ) : null}
        <aside
          className={cn(
            "chat-thread-panel border-s border-border bg-card/95 p-4 backdrop-blur-xl",
            showSettings ? "is-open" : "",
          )}
        >
          <div className="chat-side-employee">
            <span className="relative block size-14 shrink-0 overflow-hidden rounded-xl">
              <Portrait memberId={member.id} name={member.name} className="size-full" />
              <span className="absolute bottom-1 end-1 size-2.5 rounded-full border-2 border-card bg-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-black">{member.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{member.role}</span>
            </span>
            <button type="button" onClick={() => setShowSettings(false)} aria-label="إغلاق القائمة">
              <X className="size-4" />
            </button>
          </div>
          {owned.length ? (
            <section className="chat-side-section">
              <p className="chat-side-label">حسابات {member.name}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {owned.map((integration) => (
                  <span
                    key={integration.id}
                    className="flex min-w-0 items-center gap-2 rounded-lg border border-border/70 p-2 text-xs font-bold"
                  >
                    <AppIcon name={integration.provider} className="size-5 shrink-0" />
                    <span className="truncate">{appLabel(integration.provider)}</span>
                    <span
                      className={cn(
                        "ms-auto size-1.5 shrink-0 rounded-full",
                        integration.status === "connected"
                          ? "bg-primary"
                          : "bg-muted-foreground/40",
                      )}
                    />
                  </span>
                ))}
              </div>
            </section>
          ) : null}
          <div className="chat-side-section">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display font-black">محادثات {member.name}</h2>
              <button
                type="button"
                aria-label="محادثة جديدة"
                title="محادثة جديدة"
                disabled={!workspace || createConversation.isPending}
                onClick={() =>
                  createConversation.mutate(undefined, {
                    onSuccess: (row) => setConversationId(row.id),
                  })
                }
                className="grid size-9 place-items-center rounded-xl border border-border transition-colors hover:bg-secondary disabled:opacity-50"
              >
                {createConversation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
              </button>
            </div>
            <div className="mt-3 max-h-[45dvh] space-y-1 overflow-y-auto">
              {(conversations ?? []).map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "chat-side-thread group",
                    conversation.id === conversationId
                      ? "border-primary/40 bg-primary/10"
                      : "border-transparent hover:bg-secondary/70",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setConversationId(conversation.id)}
                    onDoubleClick={() => {
                      const title = window.prompt("اسم المحادثة", conversation.title)?.trim();
                      if (title) renameConversation.mutate({ id: conversation.id, title });
                    }}
                    className="min-w-0 flex-1 truncate px-2 py-1 text-start text-sm font-semibold"
                    title="انقر مرتين لإعادة التسمية"
                  >
                    {conversation.title}
                  </button>
                  <button
                    type="button"
                    aria-label="حذف المحادثة"
                    title="حذف المحادثة"
                    onClick={() => {
                      if (window.confirm("حذف هذه المحادثة ورسائلها؟"))
                        deleteConversation.mutate(conversation.id);
                    }}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-coral/10 hover:text-coral group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <section className="chat-side-section">
            <p className="chat-side-label mb-3">التنفيذ والمتابعة</p>
            <ActionPanel
              employeeId={id}
              workspaceId={workspace?.id}
              connected={(integrations ?? [])
                .filter((i) => i.status === "connected")
                .map((i) => i.provider)}
            />
          </section>
          <div className="chat-side-links">
            <Link to="/app/brain">
              <BookOpenText className="size-4" />
              <span>
                اقرأ عقل العلامة<small>{brainItems?.length ?? 0} مصادر معرفة</small>
              </span>
              <ArrowUpLeft className="size-3.5" />
            </Link>
            <Link to="/app/brain">
              <AudioLines className="size-4" />
              <span>
                صوت العلامة<small>{hasVoiceGuide ? "جاهز للاستخدام" : "أضف نبرة علامتك"}</small>
              </span>
              <ArrowUpLeft className="size-3.5" />
            </Link>
            <Link to="/app/integrations">
              <PlugZap className="size-4" />
              <span>
                كل التكاملات
                <small>
                  {owned.filter((item) => item.status === "connected").length} حسابات متصلة
                </small>
              </span>
              <ArrowUpLeft className="size-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
