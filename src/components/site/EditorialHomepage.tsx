import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
} from "lucide-react";

import { faqs } from "@/components/site/Faq";
import { Portrait } from "@/components/site/Portrait";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { plans } from "@/data/pricing";
import { team } from "@/data/team";
import approvalsAsset from "@/assets/product/approvals.webp.asset.json";
import brainAsset from "@/assets/product/brain.webp.asset.json";
import dashboardAsset from "@/assets/product/dashboard.webp.asset.json";
import integrationsAsset from "@/assets/product/integrations.webp.asset.json";
import reportsAsset from "@/assets/product/reports.webp.asset.json";
import approvalsVideo from "@/assets/product/approvals-section.webm.asset.json";
import brainVideo from "@/assets/product/brain-section.webm.asset.json";
import dashboardVideo from "@/assets/product/dashboard-section.webm.asset.json";
import integrationsVideo from "@/assets/product/integrations-section.webm.asset.json";
import reportsVideo from "@/assets/product/reports-section.webm.asset.json";
import sirajVideo from "@/assets/product/siraj-section.webm.asset.json";

const productScenes = [
  { label: "لوحة العمل", title: "كل ما يجري الآن، أمامك.", detail: "المهام المنجزة، ما ينتظر موافقتك، وحالة تشغيل فريقك في شاشة واحدة.", href: "/app", image: dashboardAsset.url, video: dashboardVideo.url },
  { label: "الموافقات", title: "راجع العمل قبل نشره.", detail: "مخرجات سِراج الفعلية مرتبة للمراجعة والاعتماد، مع المنصة وموعد النشر.", href: "/app/approvals", image: approvalsAsset.url, video: approvalsVideo.url },
  { label: "عقل العلامة", title: "معرفة مشروعك لا تضيع.", detail: "مواقعك وملاحظاتك ودليل صوت علامتك تبقى مرجعاً مشتركاً للفريق كله.", href: "/app/brain", image: brainAsset.url, video: brainVideo.url },
  { label: "التقارير", title: "النتيجة قابلة للقياس.", detail: "فحص سيو وتقارير بحث وتحليلات في مساحة حقيقية قابلة للطباعة.", href: "/app/reports", image: reportsAsset.url, video: reportsVideo.url },
] as const;

type DemoPhase = "idle" | "thinking" | "draft" | "approved";

function SirajStudio() {
  const [prompt, setPrompt] = useState("اكتب منشوراً لإطلاق منتجنا الجديد بنبرة واثقة وبسيطة");
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const timers = useRef<number[]>([]);
  const siraj = team.find((member) => member.id === "sonny");

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  function runDemo() {
    if (!prompt.trim() || phase === "thinking") return;
    timers.current.forEach(window.clearTimeout);
    setPhase("thinking");
    timers.current = [
      window.setTimeout(() => setPhase("draft"), 1250),
    ];
  }

  return (
    <div className="mono-studio" id="siraj-demo">
      <header className="mono-window-bar">
        <div className="mono-window-controls" aria-hidden="true"><i /><i /><i /></div>
        <strong>محادثة مع سِراج</strong>
        <span><i /> متصل</span>
      </header>
      <div className="mono-studio-body">
        <aside>
          <Portrait memberId="sonny" name="سِراج" eager />
          <strong>سِراج</strong>
          <span>مدير السوشيال ميديا</span>
          <div><b>٢٦</b><small>قدرة متخصصة</small></div>
        </aside>
        <div className="mono-studio-chat">
          <div className="mono-message is-owner"><span>أنت</span><p>{prompt || "اكتب طلبك لسِراج..."}</p></div>
          {phase === "thinking" ? (
            <div className="mono-thinking" role="status"><Loader2 aria-hidden="true" /><span>سِراج يراجع نبرة العلامة ويجهّز المسودة</span><i /><i /><i /></div>
          ) : null}
          {phase === "draft" || phase === "approved" ? (
            <div className="mono-message is-siraj">
              <span>سِراج · مسودة جاهزة</span>
              <p>{siraj?.sample[0]?.body}</p>
              <footer><span>#نمو_المشاريع</span><span>إنستقرام</span><span>اليوم، ٨:٣٠ م</span></footer>
            </div>
          ) : null}
          {phase === "approved" ? <div className="mono-scheduled" role="status"><CheckCircle2 /><span><strong>تمت الموافقة والجدولة</strong><small>سيُنشر اليوم في ٨:٣٠ م</small></span></div> : null}
          <div className="mono-composer">
            <label htmlFor="siraj-prompt">طلبك لسِراج</label>
            <textarea id="siraj-prompt" value={prompt} onChange={(event) => { setPrompt(event.target.value); setPhase("idle"); }} rows={2} />
            <Button type="button" size="icon" onClick={runDemo} disabled={!prompt.trim() || phase === "thinking"} aria-label="إرسال الطلب">
              {phase === "thinking" ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
          {(phase === "draft" || phase === "approved") ? (
            <div className="mono-approval-row">
              <Button type="button" variant="outline" onClick={() => setPhase("idle")}>تعديل الطلب</Button>
              <Button type="button" onClick={() => setPhase("approved")} disabled={phase === "approved"}><Check /> {phase === "approved" ? "تمت الموافقة" : "موافقة وجدولة"}</Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EditorialHomepage() {
  return (
    <div className="mono-home">
      <section className="mono-hero" aria-labelledby="home-title">
        <div className="sahl-smoke sahl-smoke-hero" aria-hidden="true"><i /><i /><i /></div>
        <div className="mono-grid-field" aria-hidden="true" />
        <div className="mono-shell mono-hero-grid">
          <div className="mono-hero-copy">
            <p className="mono-kicker"><span>الإصدار الجديد</span> فريق عمل عربي، جاهز الآن.</p>
            <h1 id="home-title">كل شغل مشروعك.<br /><em>يُنجز من مكان واحد.</em></h1>
            <p>ستة موظفين رقميين يكتبون ويصمّمون ويبيعون وينظّمون ويحلّلون — بالعربية، وبنبرة مشروعك، وعلى مدار الساعة.</p>
            <div className="mono-actions">
              <Link to="/auth" search={{ mode: "signup" as const }}>ابدأ مجاناً <ArrowLeft /></Link>
              <a href="#siraj-demo"><MessageSquareText /> جرّب محادثة حقيقية</a>
            </div>
            <span className="mono-trial"><CheckCircle2 /> ١٤ يوماً مجاناً · بدون بطاقة بنكية</span>
          </div>
          <div className="mono-hero-product">
            <Link to="/app" className="mono-real-media is-hero" aria-label="افتح مساحة عمل سهل التجريبية">
              <video autoPlay muted loop playsInline poster={dashboardAsset.url} preload="metadata">
                <source src={dashboardVideo.url} type="video/webm" />
              </video>
              <span><i /> تسجيل حقيقي من مساحة سهل <ArrowLeft /></span>
            </Link>
          </div>
        </div>
        <div className="mono-scroll-cue" aria-hidden="true"><span>مرّر لتشاهد الفريق يعمل</span><i /></div>
      </section>

      <section className="mono-proof" aria-label="نطاق عمل سهل">
        <div className="mono-shell">
          <p>مساحة واحدة لدورة العمل كاملة</p>
          <div><span><strong>٦</strong> موظفين متخصصين</span><span><strong>٢٤/٧</strong> عمل مستمر</span><span><strong>٧</strong> منصات نشر</span><span><strong>١٥</strong> مصدر بيانات</span></div>
        </div>
      </section>

      <section className="mono-team-system" id="team">
        <div className="mono-shell">
          <header className="mono-section-head"><span>٠١ — الفريق</span><h2>ليست أدوات متفرقة.<br />إنها منظومة تسلّم بعضها.</h2><p>اختر أي موظف لترى تخصصه ومخرجاته. كل شخص يعرف دوره، والسياق ينتقل معه إلى الخطوة التالية.</p></header>
          <div className="mono-team-grid">
            {team.map((member, index) => {
              const Icon = member.icon;
              return (
                <Link key={member.id} to="/employees/$id" params={{ id: member.id }} className="mono-team-cell">
                  <span className="mono-cell-number">٠{index + 1}</span><Icon aria-hidden="true" />
                  <Portrait memberId={member.id} name={member.name} eager={index < 2} />
                  <div><small>{member.role}</small><h3>{member.name}</h3><p>{member.title}</p><span>{member.tasks[0]} <ArrowLeft /></span></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mono-day mono-product-tour">
        <div className="mono-shell mono-day-layout">
          <div className="mono-day-copy"><span>٠٢ — داخل المنتج</span><h2>هذه سهل.<br />كما ستستخدمها فعلاً.</h2><p>جولة مسجّلة من مساحة العمل الحقيقية: التقويم، الموافقات، عقل العلامة، ثم التقارير.</p><Link to="/app">افتح مساحة التجربة <ArrowLeft /></Link></div>
          <Link to="/app" className="mono-real-media is-tour" aria-label="شاهد مساحة عمل سهل">
             <video autoPlay muted loop playsInline poster={dashboardAsset.url} preload="metadata"><source src={dashboardVideo.url} type="video/webm" /></video>
             <span><i /> لوحة العمل · تسجيل حقيقي</span>
          </Link>
        </div>
      </section>

      <section className="mono-siraj-section">
        <div className="mono-shell">
          <header className="mono-section-head"><span>٠٣ — جرّب المنتج</span><h2>اكتب الطلب.<br />وشاهد سِراج ينفّذه.</h2><p>جرّب الطلب هنا، أو افتح محادثة سِراج الكاملة داخل مساحة العمل.</p><Link className="mono-inline-link" to="/app/chat/$id" params={{ id: "sonny" }}>افتح محادثة سِراج الحقيقية <ArrowLeft /></Link></header>
          <Link to="/app/chat/$id" params={{ id: "sonny" }} className="mono-real-media is-wide mono-section-video" aria-label="شاهد سراج داخل مساحة العمل"><video autoPlay muted loop playsInline poster={dashboardAsset.url} preload="none"><source src={sirajVideo.url} type="video/webm" /></video><span><i /> سِراج ينفّذ الطلب داخل المنتج</span></Link>
          <SirajStudio />
        </div>
      </section>

      <section className="mono-flow-section">
        <div className="mono-shell">
          <header className="mono-section-head is-wide"><span>٠٤ — المراجعة البشرية</span><h2>الموظفون ينجزون.<br />وأنت صاحب القرار.</h2><p>لقطة مباشرة من طابور الموافقات الحقيقي، وفيه محتوى سِراج الجاهز للنشر.</p></header>
          <Link to="/app/approvals" className="mono-real-media is-wide" aria-label="افتح طابور الموافقات"><video autoPlay muted loop playsInline poster={approvalsAsset.url} preload="none"><source src={approvalsVideo.url} type="video/webm" /></video><span><i /> مراجعة المخرجات الفعلية</span></Link>
        </div>
      </section>

      <section className="mono-network-section">
        <div className="mono-shell mono-network-layout">
          <header className="mono-section-head"><span>٠٥ — التكاملات</span><h2>حساباتك،<br />داخل مساحة العمل.</h2><p>هذه صفحة الربط الفعلية كما هي. كل موظف يرى الأدوات التي يحتاجها، دون ادعاء أن حساباً غير مربوط متصل.</p><Link to="/app/integrations">افتح صفحة التكاملات <ArrowLeft /></Link></header>
           <Link to="/app/integrations" className="mono-real-media is-dark" aria-label="افتح تكاملات سهل"><video autoPlay muted loop playsInline poster={integrationsAsset.url} preload="none"><source src={integrationsVideo.url} type="video/webm" /></video><span><i /> استعراض حسابات الربط الفعلية</span></Link>
        </div>
      </section>

      <section className="mono-product-scenes">
        <div className="mono-shell">
          <header className="mono-section-head"><span>٠٦ — المنتج كما هو</span><h2>لا صور دعائية.<br />هذه الشاشات الفعلية.</h2><p>اختر أي مشهد لفتحه داخل مساحة سهل التجريبية.</p></header>
          <div className="mono-scenes-grid">
            {productScenes.map((scene) => <Link key={scene.label} to={scene.href} className="mono-scene-card"><div><span>{scene.label}</span><h3>{scene.title}</h3><p>{scene.detail}</p><b>جرّبها الآن <ArrowLeft /></b></div><figure><video autoPlay muted loop playsInline poster={scene.image} preload="none"><source src={scene.video} type="video/webm" /></video><figcaption><i /> تسجيل فعلي لهذا الجزء</figcaption></figure></Link>)}
          </div>
        </div>
      </section>

      <section className="mono-use-cases">
        <div className="mono-shell"><header className="mono-section-head"><span>٠٧ — حسب مشروعك</span><h2>فريق واحد.<br />سياق مختلف لكل نشاط.</h2></header>
          <div className="mono-use-grid">
            <Link to="/use-cases/$id" params={{ id: "ecommerce" }}><span>٠١</span><small>المتاجر الإلكترونية</small><h3>محتوى، حملات، دعم ومتابعة مبيعات.</h3><ArrowLeft /></Link>
            <Link to="/use-cases/$id" params={{ id: "restaurants" }}><span>٠٢</span><small>المطاعم والكافيهات</small><h3>حضور محلي مستمر وردود لا تتأخر.</h3><ArrowLeft /></Link>
            <Link to="/use-cases/$id" params={{ id: "clinics" }}><span>٠٣</span><small>العيادات</small><h3>تنظيم المواعيد ومحتوى يبني الثقة.</h3><ArrowLeft /></Link>
            <Link to="/use-cases/$id" params={{ id: "realestate" }}><span>٠٤</span><small>العقار والمقاولات</small><h3>فرص مؤهلة وعروض جاهزة للمتابعة.</h3><ArrowLeft /></Link>
          </div>
        </div>
      </section>

      <section className="mono-pricing" id="pricing">
        <div className="mono-shell"><header className="mono-section-head is-wide"><span>٠٨ — الأسعار</span><h2>ابدأ بحجمك اليوم.<br />وكبّر الفريق عندما تحتاج.</h2></header>
          <div className="mono-plan-grid">
            {plans.map((plan) => <article key={plan.id} className={plan.highlight ? "is-highlight" : ""}><span>{plan.tag}</span><h3>{plan.name}</h3><div>{plan.monthly ? <><strong>{plan.monthly.toLocaleString("ar-SA")}</strong><small>ر.س / شهرياً</small></> : <strong className="is-text">حسب الطلب</strong>}</div><p>{plan.desc}</p><ul>{plan.perks.slice(0, 4).map((perk) => <li key={perk}><Check />{perk}</li>)}</ul>{plan.monthly ? <Link to="/auth" search={{ mode: "signup" as const }}>{plan.cta}<ArrowLeft /></Link> : <Link to="/contact">{plan.cta}<ArrowLeft /></Link>}</article>)}
          </div>
        </div>
      </section>

      <section className="mono-faq" id="faq"><div className="mono-shell mono-faq-layout"><header className="mono-section-head"><span>٠٩ — قبل أن تبدأ</span><h2>إجابات واضحة.</h2><p>كل ما تحتاج معرفته قبل توظيف فريقك الرقمي.</p></header><Accordion type="single" collapsible>{faqs.map((item, index) => <AccordionItem key={item.q} value={`faq-${index}`}><AccordionTrigger>{item.q}</AccordionTrigger><AccordionContent>{item.a}</AccordionContent></AccordionItem>)}</Accordion></div></section>

      <section className="mono-final"><div className="sahl-smoke sahl-smoke-final" aria-hidden="true"><i /><i /><i /></div><div className="mono-grid-field" aria-hidden="true" /><div className="mono-shell"><span>الفريق جاهز</span><h2>حوّل قائمة المهام<br />إلى نتائج مكتملة.</h2><Link to="/auth" search={{ mode: "signup" as const }}>ابدأ ١٤ يوماً مجاناً <ArrowLeft /></Link><p><Clock3 /> الإعداد الأول يستغرق دقائق</p></div></section>
      <SiteFooter />
    </div>
  );
}