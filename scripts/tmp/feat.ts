import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { extractDecisions, recordDecisions, decisionsBlock } from "@/lib/decisions.server";
import { judgeAndImprove } from "@/lib/quality-judge.server";
import { refreshProposals } from "@/lib/proactive.server";

const c = createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
  auth: { persistSession: false },
});
const { data: ws } = await c.from("workspaces").select("id").limit(1).single();
const wsId = ws!.id;

const request =
  "قررنا نثبت الميزانية الشهرية للإعلانات عند 30 ألف ريال، ونمنع أي خصم أكثر من 15%، والنشر يكون على إنستقرام وتيك توك فقط. اكتب لي خطة الحملة على هذا الأساس بالتفصيل.";
const reply =
  "ماشي. خطة الحملة مبنية على ميزانية 30 ألف ريال شهرياً موزعة 60% إنستقرام و40% تيك توك، بحد خصم أقصى 15% في كل العروض. الأسبوع الأول: تعريف بالمنتج بثلاث مقاطع قصيرة. الأسبوع الثاني: إثبات اجتماعي من عملاء حقيقيين. الأسبوع الثالث: عرض محدود بخصم 15% كحد أقصى. الأسبوع الرابع: قياس ومضاعفة أفضل إعلان. المؤشرات: تكلفة الاكتساب أقل من 45 ريالاً ومعدل التحويل فوق 2.5%.";

const drafts = await extractDecisions(request, reply);
console.log("EXTRACTED", JSON.stringify(drafts, null, 1));
const saved = await recordDecisions(c, { workspaceId: wsId, employeeId: "sonny", drafts });
console.log("SAVED", saved);
console.log("BLOCK\n" + (await decisionsBlock(c, wsId, "اكتب منشور عن عرض جديد")));

const v = await judgeAndImprove({
  employeeId: "sonny",
  request: "اكتب منشور إنستقرام عن عرض عطر عود",
  output: "عرض جديد. اشتري الان. الافضل في العالم مجانا 100%",
  criteria: ["منشور عربي واضح بلا مبالغة", "دعوة عمل واحدة", "3 أسطر على الأقل"],
  bannedWords: ["الأفضل في العالم", "مجاناً 100%"],
});
console.log("JUDGE", { score: v.score, revised: v.revised, issues: v.issues, out: v.output.slice(0, 300) });

const r = await refreshProposals(c, wsId);
console.log("PROPOSALS", r);
console.log((await c.from("proposals").select("title,signal,priority,status,skill_id").eq("workspace_id", wsId)).data);
process.exit(0);
