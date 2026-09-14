import { Reveal } from "@/components/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const faqs = [
  {
    q: "هل المحتوى مترجم من الإنجليزي؟",
    a: "لا. النماذج تُوجَّه بالعربية مباشرة مع أمثلة من سوقك ولهجتك، وتراجع المخرجات على قواعد لغوية عربية قبل النشر — بما في ذلك النص داخل الصور.",
  },
  {
    q: "هل ينشر نيابةً عني على حساباتي؟",
    a: "نعم، بعد ربط الحسابات رسمياً عبر واجهات المنصات. تستطيع تشغيل وضع المراجعة ليطلب موافقتك قبل كل منشور.",
  },
  {
    q: "ماذا لو لم أعجب بالمخرجات؟",
    a: "كل مخرج قابل للتعديل، والفريق يتعلم من تعديلاتك. وفي أي وقت تصدّر بياناتك ومحتواك بالكامل.",
  },
  {
    q: "هل بياناتي آمنة؟",
    a: "تُخزَّن بياناتك مشفّرة، ولا تُستخدم لتدريب نماذج عامة، ويمكنك حذف حسابك وكل ما يتصل به فوراً.",
  },
  {
    q: "هل أحتاج خبرة تقنية؟",
    a: "لا. الإعداد أسئلة بسيطة عن نشاطك، والباقي واجهة واحدة تتابع منها الفريق.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-24">
      <Reveal>
        <p className="text-center text-sm font-bold tracking-wider text-primary">الأسئلة الشائعة</p>
        <h2 className="mt-3 text-center font-display text-4xl font-black md:text-5xl">أسئلة متكررة</h2>
        <p className="mx-auto mt-4 max-w-md text-center text-muted-foreground">
          لم تجد إجابتك؟ راسلنا وسيردّ عليك إنسان حقيقي خلال يوم عمل.
        </p>
      </Reveal>
      <Reveal delay={80}>
        <Accordion type="single" collapsible className="faq-accordion mt-10 space-y-3">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="faq-item border-border">
              <AccordionTrigger className="faq-trigger px-5 text-right font-display text-lg font-bold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="faq-answer px-5 text-base leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
