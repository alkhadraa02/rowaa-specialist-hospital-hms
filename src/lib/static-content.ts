export type Bi = { ar: string; en: string };

export const FAQ: { q: Bi; a: Bi }[] = [
  {
    q: { ar: "كيف أحجز موعداً؟", en: "How do I book an appointment?" },
    a: { ar: "من صفحة «احجز موعداً» اختر التخصص ثم الطبيب والفرع والوقت، وأدخل بياناتك لتصلك رقم الحجز فوراً.", en: "Use the Book page: choose a specialty, doctor, branch and time, then enter your details to receive a booking number instantly." },
  },
  {
    q: { ar: "هل يمكنني إلغاء الموعد أو تعديله؟", en: "Can I cancel or change my appointment?" },
    a: { ar: "نعم، تواصل مع الرقم الموحد قبل الموعد بساعتين على الأقل وسيعيد الفريق جدولته دون رسوم.", en: "Yes. Call the unified number at least two hours before your slot and the team will reschedule at no charge." },
  },
  {
    q: { ar: "ماذا أحضر معي في الزيارة الأولى؟", en: "What should I bring to my first visit?" },
    a: { ar: "الهوية الوطنية أو الإقامة وبطاقة التأمين إن وجدت وأي تقارير أو أدوية حالية.", en: "Your national ID or iqama, your insurance card if any, and any current reports or medications." },
  },
  {
    q: { ar: "هل الطوارئ تعمل على مدار الساعة؟", en: "Is the emergency department open 24/7?" },
    a: { ar: "نعم، قسم الطوارئ يستقبل الحالات على مدار الساعة طوال أيام الأسبوع. في الحالات الحرجة اتصل بالإسعاف 997.", en: "Yes, the emergency department receives cases around the clock. In critical cases call the ambulance on 997." },
  },
  {
    q: { ar: "كيف أطّلع على نتائج التحاليل؟", en: "How do I view my lab results?" },
    a: { ar: "من بوابة المريض بعد تسجيل الدخول تجد المواعيد والنتائج والوصفات والفواتير.", en: "In the patient portal after signing in: appointments, results, prescriptions and invoices." },
  },
  {
    q: { ar: "هل هذه بيانات حقيقية؟", en: "Is this real data?" },
    a: { ar: "لا. هذا نظام تجريبي بيانات فيه خيالية بالكامل وليس جهازاً طبياً.", en: "No. This is a demo system with entirely fictional data and is not a medical device." },
  },
];

export const VISITOR: { h: Bi; items: Bi[] }[] = [
  {
    h: { ar: "ساعات الزيارة", en: "Visiting hours" },
    items: [
      { ar: "الأقسام العامة: من 4 عصراً حتى 8 مساءً يومياً.", en: "General wards: 4 pm to 8 pm daily." },
      { ar: "العناية المركزة: زائران كحد أقصى لمدة 15 دقيقة في المواعيد المحددة.", en: "Intensive care: two visitors maximum for 15 minutes at set times." },
      { ar: "قسم الولادة: من 5 مساءً حتى 8 مساءً.", en: "Maternity: 5 pm to 8 pm." },
    ],
  },
  {
    h: { ar: "الوصول والمواقف", en: "Getting here and parking" },
    items: [
      { ar: "مواقف مجانية للزوار لمدة ساعتين، ومواقف مخصصة لذوي الإعاقة قرب المداخل.", en: "Free visitor parking for two hours, with accessible bays near the entrances." },
      { ar: "خدمة الكراسي المتحركة متاحة عند المدخل الرئيسي.", en: "Wheelchair assistance is available at the main entrance." },
    ],
  },
  {
    h: { ar: "إرشادات للزوار", en: "Visitor guidance" },
    items: [
      { ar: "عقّم يديك عند الدخول والخروج.", en: "Sanitise your hands on entry and exit." },
      { ar: "يُنصح بعدم اصطحاب الأطفال دون 12 سنة إلى الأقسام الداخلية.", en: "Children under 12 are discouraged from visiting inpatient wards." },
      { ar: "التصوير داخل المنشأة ممنوع حفاظاً على خصوصية المرضى.", en: "Photography is not allowed, to protect patient privacy." },
    ],
  },
];

export const RIGHTS: { h: Bi; p: Bi }[] = [
  { h: { ar: "الرعاية الكريمة والآمنة", en: "Respectful and safe care" }, p: { ar: "لك الحق في رعاية تحفظ كرامتك وتراعي ثقافتك ومعتقداتك دون تمييز.", en: "You have the right to care that preserves your dignity and respects your culture and beliefs without discrimination." } },
  { h: { ar: "المعلومة والموافقة", en: "Information and consent" }, p: { ar: "لك أن تعرف تشخيصك وخطة علاجك ومخاطرها وبدائلها، ولا يُجرى إجراء دون موافقتك المستنيرة.", en: "You may know your diagnosis, treatment plan, risks and alternatives, and no procedure is done without your informed consent." } },
  { h: { ar: "الخصوصية والسرية", en: "Privacy and confidentiality" }, p: { ar: "سجلك الطبي سري ولا يُطلع عليه إلا المعالجون المخوّلون أو بنظام.", en: "Your medical record is confidential and visible only to authorised caregivers or as required by law." } },
  { h: { ar: "الرأي الثاني والشكوى", en: "Second opinion and complaints" }, p: { ar: "يحق لك طلب رأي طبي ثانٍ وتقديم شكوى عبر صفحة التواصل دون أن يؤثر ذلك على رعايتك.", en: "You may request a second opinion and file a complaint through the contact page without affecting your care." } },
];

export const ABOUT = {
  mission: { ar: "نقدّم رعاية متخصصة آمنة وإنسانية بمعايير عالمية، ونجعل رحلة المريض أوضح وأسهل.", en: "We provide safe, humane specialist care to international standards and make the patient journey clearer and easier." },
  values: [
    { ar: "سلامة المريض أولاً", en: "Patient safety first" },
    { ar: "الشفافية في الأسعار والنتائج", en: "Transparency in prices and outcomes" },
    { ar: "التعلّم المستمر", en: "Continuous learning" },
    { ar: "التقنية في خدمة الإنسان", en: "Technology serving people" },
  ] as Bi[],
};
