import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCheck, ArrowLeft, AlertTriangle, Loader2, CircleCheck, Clock3, Link2, PlayCircle } from "lucide-react";

import { ActivationMap } from "@/components/app/ActivationMap";
import { AppShell } from "@/components/app/AppShell";
import { BusinessProfileCard } from "@/components/app/BusinessProfileCard";
import { MorningBriefingCard } from "@/components/app/MorningBriefingCard";
import { AppIcon, appLabel } from "@/components/site/AppIcon";
import { getMember } from "@/data/team";
import { taskStatusLabel } from "@/data/app";
import { useIntegrations, useProfile, useTasks, useWorkspace } from "@/lib/data";
import { Portrait } from "@/components/site/Portrait";
import { BrandLoader } from "@/components/site/BrandLoader";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "مساحة عملك | سهل" },
      { name: "description", content: "نظرة عامة على عمل فريقك الرقمي اليوم." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppHome,
});

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `قبل ${hrs} ساعة`;
  return `قبل ${Math.round(hrs / 24)} يوم`;
}

function AppHome() {
  const { data: profile } = useProfile();
  const { data: workspace } = useWorkspace();
  const { data: tasks, isLoading } = useTasks(workspace?.id);
  const { data: integrations } = useIntegrations(workspace?.id);

  const list = tasks ?? [];
  const review = list.filter((t) => t.status === "review");
  const running = list.filter((t) => t.status === "running");
  const done = list.filter((t) => t.status === "done");
  const broken = (integrations ?? []).filter((i) => i.status === "error");

  const kpis = [
    { k: "مهام منجزة", v: String(done.length), d: "منذ انطلاق مساحتك", icon: CircleCheck, tone: "bg-jade/12 text-jade" },
    { k: "قيد التنفيذ", v: String(running.length), d: "فريقك يعمل الآن", icon: PlayCircle, tone: "bg-amber/15 text-amber" },
    { k: "بانتظار موافقتك", v: String(review.length), d: "تحتاج قرارك", icon: Clock3, tone: "bg-coral/12 text-coral" },
    {
      k: "حسابات مرتبطة",
      v: String((integrations ?? []).filter((i) => i.status === "connected").length),
      d: `من أصل ${integrations?.length ?? 0}`,
      icon: Link2,
      tone: "bg-sky/15 text-ink-soft",
    },
  ];

  return (
    <AppShell
      title={`أهلاً ${profile?.full_name ?? ""} 👋`}
      lead={`${review.length} عناصر تنتظر موافقتك · فريقك يعمل على ${running.length} مهام`}
    >
      {broken.length ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-coral/30 bg-coral/8 p-4">
          <AlertTriangle className="size-5 shrink-0 text-coral" />
          <p className="flex-1 text-sm font-semibold">
            {broken.length} حساب يحتاج إعادة ربط — المهام المرتبطة به متوقفة.
          </p>
          <Link
            to="/app/integrations"
            className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background"
          >
            إصلاح الربط
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.k}
            className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:p-5"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -top-10 end--6 size-24 rounded-full opacity-60 blur-2xl transition-opacity group-hover:opacity-100"
              style={{ background: "color-mix(in oklab, var(--primary) 16%, transparent)" }}
            />
            <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0">
                <p className="truncate text-[0.72rem] font-semibold text-muted-foreground sm:text-sm">{k.k}</p>
                <p className="mt-1.5 font-display text-[1.7rem] font-black tabular-nums leading-none sm:text-4xl">{k.v}</p>
              </div>
              <span className={`grid size-9 shrink-0 place-items-center rounded-2xl ${k.tone}`}>
                <k.icon className="size-4.5" strokeWidth={2.2} />
              </span>
            </div>
            <p className="relative mt-2 truncate text-[0.7rem] text-muted-foreground">{k.d}</p>
          </div>
        ))}
      </div>

      <ActivationMap className="mt-5" />


      {workspace ? (
        <div className="mt-5">
          <BusinessProfileCard
            workspaceId={workspace.id}
            website={(workspace as { website?: string | null }).website}
            profile={(workspace as { profile?: Record<string, unknown> }).profile as never}
          />
        </div>
      ) : null}



      <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-black">آخر ما أنجزه فريقك</h2>
            <Link to="/app/tasks" className="text-sm font-bold text-primary">
              كل المهام
            </Link>
          </div>
          {isLoading ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <BrandLoader size="sm" />
            </p>
          ) : list.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-secondary/50 p-8 text-center">
              <p className="font-bold">لم يبدأ فريقك بعد</p>
              <p className="mt-1 text-sm text-ink-soft">
                افتح محادثة مع أي موظف واطلب أول مهمة — ستظهر هنا فوراً.
              </p>
              <Link
                to="/app/chat"
                className="mt-4 inline-block rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background"
              >
                ابدأ محادثة
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {list.slice(0, 6).map((t) => {
                const member = getMember(t.employee_id);
                return (
                  <li key={t.id} className="rounded-xl border border-border/70 p-4 transition-colors hover:bg-secondary/35">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      {member ? (
                        <span className="inline-flex items-center gap-1.5 font-bold">
                          <span
                            className="size-6 overflow-hidden rounded-lg"
                            style={{ background: member.tintSoft }}
                          >
                            <Portrait memberId={member.id} name={member.name} className="size-full" />
                          </span>
                          {member.name}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <AppIcon name={t.channel} className="size-3.5" />
                        {appLabel(t.channel)}
                      </span>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 font-bold">
                        {taskStatusLabel[t.status as keyof typeof taskStatusLabel] ?? t.status}
                      </span>
                      <span className="ms-auto text-muted-foreground">
                        {timeAgo(t.created_at)}
                      </span>
                    </div>
                    <p className="mt-2.5 break-words font-bold">{t.title}</p>
                    {t.detail ? (
                      <p className="mt-1 line-clamp-2 break-words text-sm leading-relaxed text-ink-soft">{t.detail}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <h2 className="font-display text-lg font-black">مهام جارية</h2>
            <ul className="mt-4 space-y-3">
              {running.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center gap-3 text-sm">
                  <span className="size-2 shrink-0 rounded-full bg-amber" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{t.title}</span>
                </li>
              ))}
              {running.length === 0 ? (
                <li className="text-sm text-muted-foreground">لا توجد مهام جارية.</li>
              ) : null}
            </ul>
            <Link
              to="/app/tasks"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary"
            >
              افتح لوحة المهام <ArrowLeft className="size-4" />
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
