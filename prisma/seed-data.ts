// Fictional content for the demo. Nothing here describes a real organisation, doctor or patient.

export const BRANCHES = [
  {
    slug: "riyadh", nameAr: "رُواء الرياض — حي الياسمين", nameEn: "Rowaa Riyadh — Al Yasmin", city: "الرياض", cityEn: "Riyadh",
    addressAr: "طريق الأمير سعود الفرعي، حي الياسمين، الرياض", addressEn: "Prince Saud Branch Road, Al Yasmin District, Riyadh",
    phone: "011 555 0100", hours: "24/7", beds: 220, clinics: 64,
    descAr: "المقر الرئيسي للمستشفى: طوارئ على مدار الساعة، عناية مركزة، مركز القلب، ومركز العظام والعمود الفقري، وجناح للولادة.",
    descEn: "The flagship campus: 24/7 emergency, intensive care, the heart centre, the orthopaedic and spine centre and a maternity wing.",
  },
  {
    slug: "jeddah", nameAr: "رُواء جدة — حي الشاطئ", nameEn: "Rowaa Jeddah — Al Shati", city: "جدة", cityEn: "Jeddah",
    addressAr: "شارع الأمير ماجد، حي الشاطئ، جدة", addressEn: "Prince Majid Street, Al Shati District, Jeddah",
    phone: "012 555 0200", hours: "24/7", beds: 110, clinics: 38,
    descAr: "فرع الساحل الغربي: طوارئ، عيادات تخصصية، مركز العيون، ومركز الجلدية والتجميل.",
    descEn: "The west-coast branch: emergency, specialty clinics, the eye centre and the dermatology and aesthetics centre.",
  },
  {
    slug: "khobar", nameAr: "رُواء الخبر — حي العقربية", nameEn: "Rowaa Khobar — Al Aqrabiyah", city: "الخبر", cityEn: "Khobar",
    addressAr: "طريق الملك فهد، حي العقربية، الخبر", addressEn: "King Fahd Road, Al Aqrabiyah District, Khobar",
    phone: "013 555 0300", hours: "07:00 – 23:00", beds: 60, clinics: 26,
    descAr: "فرع المنطقة الشرقية: عيادات تخصصية، مركز الخصوبة والإخصاب، ومركز علاج السمنة والسكري.",
    descEn: "The Eastern Province branch: specialty clinics, the fertility centre and the obesity and diabetes centre.",
  },
];

// slug, ar, en, icon, isCenter, descAr, descEn, servicesAr, servicesEn
export const SPECIALTIES: [string, string, string, string, boolean, string, string, string, string][] = [
  ["cardiology", "أمراض القلب", "Cardiology", "🫀", true, "تشخيص وعلاج أمراض القلب والشرايين بالقسطرة والتخطيط والموجات الصوتية.", "Diagnosis and treatment of heart and vascular disease with catheterisation, ECG and echocardiography.", "تخطيط القلب|إيكو القلب|اختبار الجهد|قسطرة تشخيصية وعلاجية|متابعة ضغط الدم", "ECG|Echocardiography|Stress testing|Diagnostic and therapeutic catheterisation|Blood pressure follow-up"],
  ["orthopedics", "العظام والعمود الفقري", "Orthopaedics and Spine", "🦴", true, "علاج الكسور وإصابات الملاعب وتبديل المفاصل وجراحات العمود الفقري.", "Fracture care, sports injuries, joint replacement and spine surgery.", "تبديل مفصل الركبة والورك|جراحة المناظير|جراحة العمود الفقري|الكسور والإصابات|العلاج الطبيعي بعد الجراحة", "Knee and hip replacement|Arthroscopy|Spine surgery|Fractures and trauma|Post-operative physiotherapy"],
  ["ophthalmology", "طب العيون", "Ophthalmology", "👁️", true, "فحص النظر وعلاج المياه البيضاء والزرقاء وتصحيح النظر بالليزر.", "Eye exams, cataract and glaucoma care and laser vision correction.", "فحص النظر الشامل|عمليات المياه البيضاء|علاج المياه الزرقاء|تصحيح النظر بالليزر|شبكية العين", "Comprehensive eye exam|Cataract surgery|Glaucoma care|Laser vision correction|Retina clinic"],
  ["dermatology", "الجلدية والتجميل", "Dermatology and Aesthetics", "🧴", true, "علاج الأمراض الجلدية والحساسية وتساقط الشعر والإجراءات التجميلية غير الجراحية.", "Skin disease, allergy, hair loss and non-surgical aesthetic procedures.", "الأكزيما والصدفية|حب الشباب|تساقط الشعر|الليزر الجلدي|فحص الشامات", "Eczema and psoriasis|Acne|Hair loss|Dermatologic laser|Mole screening"],
  ["obgyn", "النساء والولادة", "Obstetrics and Gynaecology", "🤰", true, "متابعة الحمل والولادة الطبيعية والقيصرية وأمراض النساء والمناظير.", "Antenatal care, vaginal and caesarean delivery, gynaecology and laparoscopy.", "متابعة الحمل|الولادة الطبيعية والقيصرية|الموجات فوق الصوتية للحمل|مناظير النساء|فحوص ما قبل الزواج", "Antenatal care|Vaginal and caesarean birth|Obstetric ultrasound|Gynaecologic laparoscopy|Pre-marital screening"],
  ["pediatrics", "طب الأطفال", "Paediatrics", "👶", false, "رعاية الأطفال من الولادة حتى المراهقة: التطعيمات والنمو والأمراض الشائعة.", "Child health from birth to adolescence: vaccination, growth and common illness.", "التطعيمات|متابعة النمو|حديثو الولادة|حساسية الأطفال|أمراض الأطفال الشائعة", "Vaccination|Growth monitoring|Newborn care|Paediatric allergy|Common childhood illness"],
  ["internal-medicine", "الباطنة", "Internal Medicine", "🩺", false, "تشخيص وعلاج الأمراض المزمنة والحالات الباطنية المعقدة للبالغين.", "Diagnosis and management of chronic and complex adult medical conditions.", "الفحص الدوري|ارتفاع الضغط|متابعة الأمراض المزمنة|تقييم الأعراض غير المشخصة", "Periodic check-up|Hypertension|Chronic disease follow-up|Assessment of undiagnosed symptoms"],
  ["general-surgery", "الجراحة العامة", "General Surgery", "🔪", false, "جراحات الفتق والمرارة والزائدة والغدة بالمنظار وبالجراحة المفتوحة.", "Hernia, gallbladder, appendix and thyroid surgery, open and laparoscopic.", "جراحة المناظير|الفتق|المرارة والزائدة|الغدة الدرقية|الجراحة العاجلة", "Laparoscopic surgery|Hernia|Gallbladder and appendix|Thyroid surgery|Emergency surgery"],
  ["neurology", "المخ والأعصاب", "Neurology", "🧠", false, "علاج الصداع والصرع والسكتات الدماغية وأمراض الأعصاب الطرفية.", "Care for headache, epilepsy, stroke and peripheral nerve disease.", "تخطيط الدماغ|تخطيط الأعصاب|عيادة الصداع|متابعة السكتة الدماغية", "EEG|Nerve conduction studies|Headache clinic|Stroke follow-up"],
  ["ent", "الأنف والأذن والحنجرة", "Ear, Nose and Throat", "👂", false, "علاج التهابات اللوزتين والجيوب وفحص السمع وجراحات الأنف والأذن.", "Tonsil and sinus infection, hearing tests and nose and ear surgery.", "قياس السمع|مناظير الأنف|اللوزتان واللحمية|جراحة الجيوب", "Audiometry|Nasal endoscopy|Tonsils and adenoids|Sinus surgery"],
  ["urology", "المسالك البولية", "Urology", "🚽", false, "علاج الحصى وتضخم البروستاتا والالتهابات البولية وأمراض الذكورة.", "Stones, prostate enlargement, urinary infection and men's health.", "تفتيت الحصى|مناظير المسالك|البروستاتا|الالتهابات البولية", "Stone lithotripsy|Urinary endoscopy|Prostate care|Urinary infection"],
  ["endocrinology", "الغدد الصماء والسكري", "Endocrinology and Diabetes", "🍬", true, "متابعة السكري والغدة الدرقية واضطرابات الهرمونات والسمنة.", "Diabetes, thyroid, hormonal disorders and obesity care.", "برنامج السكري|مضخات الأنسولين|الغدة الدرقية|هرمونات النمو والبلوغ", "Diabetes programme|Insulin pumps|Thyroid care|Growth and puberty hormones"],
  ["gastroenterology", "الجهاز الهضمي والكبد", "Gastroenterology and Liver", "🩸", false, "مناظير المعدة والقولون وعلاج أمراض الكبد والقولون العصبي.", "Gastroscopy, colonoscopy, liver disease and irritable bowel care.", "منظار المعدة|منظار القولون|أمراض الكبد|حساسية القمح", "Gastroscopy|Colonoscopy|Liver disease|Coeliac disease"],
  ["pulmonology", "الأمراض الصدرية", "Pulmonology", "🫁", false, "علاج الربو وانقطاع النفس أثناء النوم وأمراض الرئة المزمنة.", "Asthma, sleep apnoea and chronic lung disease.", "اختبار وظائف الرئة|دراسة النوم|عيادة الربو|منظار القصبات", "Lung function testing|Sleep study|Asthma clinic|Bronchoscopy"],
  ["nephrology", "أمراض الكلى", "Nephrology", "💧", false, "متابعة الفشل الكلوي المزمن وغسيل الكلى وأمراض الضغط الكلوي.", "Chronic kidney disease, dialysis and renal hypertension.", "غسيل الكلى|متابعة الفشل الكلوي|حصى الكلى|زراعة الكلى (تنسيق)", "Dialysis|Chronic kidney disease follow-up|Kidney stones|Transplant coordination"],
  ["oncology", "الأورام", "Oncology", "🎗️", false, "تشخيص الأورام وخطط العلاج الكيميائي والمناعي بإشراف فريق متعدد التخصصات.", "Tumour diagnosis and chemotherapy and immunotherapy plans from a multidisciplinary team.", "لجنة الأورام|العلاج الكيميائي|الفحص المبكر|الدعم النفسي", "Tumour board|Chemotherapy|Early screening|Psychological support"],
  ["psychiatry", "الطب النفسي", "Psychiatry", "💭", false, "علاج القلق والاكتئاب واضطرابات النوم والدعم الأسري في بيئة سرية.", "Anxiety, depression, sleep disorders and family support in a confidential setting.", "العلاج المعرفي السلوكي|عيادة القلق|اضطرابات النوم|استشارات الأسرة", "Cognitive behavioural therapy|Anxiety clinic|Sleep disorders|Family counselling"],
  ["dentistry", "طب الأسنان", "Dentistry", "🦷", false, "حشوات وتقويم وزراعة أسنان وتبييض وعلاج اللثة.", "Fillings, orthodontics, implants, whitening and gum care.", "التقويم|زراعة الأسنان|علاج الجذور|تنظيف وتبييض|أسنان الأطفال", "Orthodontics|Dental implants|Root canal|Cleaning and whitening|Paediatric dentistry"],
  ["emergency", "الطوارئ", "Emergency Medicine", "🚑", false, "استقبال الحالات الطارئة على مدار الساعة مع فرز تمريضي وفريق إنعاش.", "24/7 emergency reception with nurse triage and a resuscitation team.", "الفرز الطبي|الإنعاش|الإصابات|الحالات الحرجة", "Triage|Resuscitation|Trauma|Critical care"],
  ["rehabilitation", "الطب الطبيعي وإعادة التأهيل", "Physical Medicine and Rehabilitation", "🏃", false, "برامج علاج طبيعي لإصابات العمود والمفاصل وما بعد السكتة والجراحة.", "Physiotherapy for spine, joint, post-stroke and post-surgical recovery.", "العلاج الطبيعي|التأهيل بعد السكتة|علاج الألم|أجهزة التأهيل", "Physiotherapy|Post-stroke rehabilitation|Pain management|Rehabilitation equipment"],
  ["family-medicine", "طب الأسرة", "Family Medicine", "👪", false, "رعاية أولية لجميع أفراد الأسرة والفحوصات الدورية والتطعيمات.", "Primary care for the whole family: periodic exams and vaccination.", "الفحص الشامل|التطعيمات|متابعة الأمراض المزمنة|شهادات طبية", "Comprehensive check-up|Vaccination|Chronic disease follow-up|Medical certificates"],
  ["fertility", "الخصوبة والإخصاب", "Fertility and IVF", "🧬", true, "تقييم العقم وعلاجه بالتلقيح والإخصاب المجهري مع دعم نفسي للزوجين.", "Infertility work-up and treatment with IUI and IVF, with couple counselling.", "تقييم الخصوبة|التلقيح الصناعي|الإخصاب المجهري|فحوص الرجال", "Fertility assessment|Intrauterine insemination|IVF|Male fertility testing"],
  ["bariatric", "جراحة السمنة", "Bariatric Surgery", "⚖️", true, "برنامج متكامل لتخفيف الوزن: تغذية وسلوك وجراحات تكميم وتحويل المسار.", "A complete weight-loss programme: nutrition, behaviour and sleeve and bypass surgery.", "تقييم السمنة|تكميم المعدة|تحويل المسار|التغذية العلاجية|متابعة ما بعد الجراحة", "Obesity assessment|Sleeve gastrectomy|Gastric bypass|Clinical nutrition|Post-surgery follow-up"],
  ["radiology", "الأشعة التشخيصية", "Diagnostic Radiology", "📷", false, "تصوير بالأشعة السينية والمقطعية والرنين والموجات الصوتية مع تقارير استشارية.", "X-ray, CT, MRI and ultrasound with consultant reporting.", "الأشعة السينية|المقطعية|الرنين المغناطيسي|السونار", "X-ray|CT|MRI|Ultrasound"],
];

export const FIRST_M: [string, string][] = [["محمد", "Mohammed"], ["عبدالله", "Abdullah"], ["خالد", "Khalid"], ["فهد", "Fahad"], ["سلطان", "Sultan"], ["ياسر", "Yasser"], ["ماجد", "Majed"], ["طارق", "Tariq"], ["أنس", "Anas"], ["هشام", "Hisham"], ["بدر", "Badr"], ["راكان", "Rakan"], ["سعود", "Saud"], ["عمر", "Omar"]];
export const FIRST_F: [string, string][] = [["نورة", "Noura"], ["سارة", "Sarah"], ["ريم", "Reem"], ["هند", "Hind"], ["لمى", "Lama"], ["منى", "Muna"], ["أروى", "Arwa"], ["دانة", "Dana"], ["غادة", "Ghada"], ["جود", "Joud"], ["لجين", "Lujain"], ["هيا", "Haya"], ["مها", "Maha"], ["شهد", "Shahad"]];
export const FAMILY: [string, string][] = [["العتيبي", "Al-Otaibi"], ["القحطاني", "Al-Qahtani"], ["الغامدي", "Al-Ghamdi"], ["الدوسري", "Al-Dosari"], ["الشهري", "Al-Shehri"], ["الزهراني", "Al-Zahrani"], ["المطيري", "Al-Mutairi"], ["الحربي", "Al-Harbi"], ["السبيعي", "Al-Subaie"], ["العنزي", "Al-Anazi"], ["الشمري", "Al-Shammari"], ["البلوي", "Al-Balawi"], ["الحازمي", "Al-Hazmi"], ["باعشن", "Baashen"], ["الخطيب", "Al-Khatib"], ["النجار", "Al-Najjar"], ["اليامي", "Al-Yami"], ["العمري", "Al-Omari"]];

export const INSURERS = [
  ["الدرع الوطني للتأمين", "Al-Dir National Insurance", "A", "شبكة واسعة تشمل جميع فروع رُواء.", "Wide network covering every Rowaa branch."],
  ["نجمة للتأمين التعاوني", "Najma Cooperative Insurance", "A", "تغطية العيادات والتنويم والولادة حسب الوثيقة.", "Outpatient, inpatient and maternity cover as per policy."],
  ["واحة للتأمين الصحي", "Waha Health Insurance", "B", "موافقات مسبقة إلكترونية للإجراءات الكبرى.", "Electronic pre-authorisation for major procedures."],
  ["مدار كير", "Madar Care", "B", "برامج للشركات والأفراد.", "Corporate and individual programmes."],
  ["سند الصحي", "Sanad Health", "B", "تغطية الأمراض المزمنة والأدوية.", "Chronic disease and medication cover."],
  ["أفق للتأمين", "Ofoq Insurance", "C", "وثائق اقتصادية للعيادات الخارجية.", "Economy outpatient policies."],
  ["بوابة الخليج للتأمين", "Gulf Gate Insurance", "A", "تغطية الطوارئ على مدار الساعة.", "24/7 emergency cover."],
  ["ركيزة هيلث", "Rakeeza Health", "C", "وثائق تكميلية للأسنان والعيون.", "Supplementary dental and optical policies."],
] as const;

export const ICD10: [string, string, string, string][] = [
  ["I10", "Essential hypertension", "ارتفاع ضغط الدم الأساسي", "Circulatory"],
  ["I20.9", "Angina pectoris, unspecified", "ذبحة صدرية", "Circulatory"],
  ["I21.9", "Acute myocardial infarction, unspecified", "احتشاء عضلة القلب الحاد", "Circulatory"],
  ["I48.91", "Atrial fibrillation, unspecified", "رجفان أذيني", "Circulatory"],
  ["I63.9", "Cerebral infarction, unspecified", "احتشاء دماغي", "Circulatory"],
  ["E11.9", "Type 2 diabetes mellitus without complications", "السكري من النوع الثاني", "Endocrine"],
  ["E10.9", "Type 1 diabetes mellitus without complications", "السكري من النوع الأول", "Endocrine"],
  ["E03.9", "Hypothyroidism, unspecified", "قصور الغدة الدرقية", "Endocrine"],
  ["E66.9", "Obesity, unspecified", "السمنة", "Endocrine"],
  ["E78.5", "Hyperlipidaemia, unspecified", "ارتفاع الدهون", "Endocrine"],
  ["J00", "Acute nasopharyngitis (common cold)", "زكام", "Respiratory"],
  ["J02.9", "Acute pharyngitis, unspecified", "التهاب الحلق الحاد", "Respiratory"],
  ["J06.9", "Acute upper respiratory infection", "التهاب الجهاز التنفسي العلوي", "Respiratory"],
  ["J18.9", "Pneumonia, unspecified", "التهاب رئوي", "Respiratory"],
  ["J45.909", "Asthma, unspecified", "الربو", "Respiratory"],
  ["K29.70", "Gastritis, unspecified", "التهاب المعدة", "Digestive"],
  ["K21.9", "Gastro-oesophageal reflux disease", "ارتجاع المريء", "Digestive"],
  ["K35.80", "Acute appendicitis", "التهاب الزائدة الدودية", "Digestive"],
  ["K80.20", "Gallstones without obstruction", "حصى المرارة", "Digestive"],
  ["R10.4", "Abdominal pain, unspecified", "ألم في البطن", "Symptoms"],
  ["R07.9", "Chest pain, unspecified", "ألم في الصدر", "Symptoms"],
  ["R50.9", "Fever, unspecified", "حمّى", "Symptoms"],
  ["R51", "Headache", "صداع", "Symptoms"],
  ["R55", "Syncope and collapse", "إغماء", "Symptoms"],
  ["N39.0", "Urinary tract infection", "التهاب المسالك البولية", "Genitourinary"],
  ["N20.0", "Calculus of kidney", "حصى الكلى", "Genitourinary"],
  ["M54.5", "Low back pain", "ألم أسفل الظهر", "Musculoskeletal"],
  ["M17.9", "Osteoarthritis of knee", "خشونة الركبة", "Musculoskeletal"],
  ["M25.57", "Pain in ankle and joints of foot", "ألم في الكاحل", "Musculoskeletal"],
  ["S93.4", "Sprain of ankle", "التواء الكاحل", "Injury"],
  ["S52.50", "Fracture of lower end of radius", "كسر في أسفل عظم الكعبرة", "Injury"],
  ["S61.9", "Open wound of wrist and hand", "جرح مفتوح في اليد", "Injury"],
  ["S06.0", "Concussion", "ارتجاج في الدماغ", "Injury"],
  ["H66.90", "Otitis media, unspecified", "التهاب الأذن الوسطى", "ENT"],
  ["H10.9", "Conjunctivitis, unspecified", "التهاب الملتحمة", "Eye"],
  ["L20.9", "Atopic dermatitis, unspecified", "الأكزيما", "Skin"],
  ["L70.0", "Acne vulgaris", "حب الشباب", "Skin"],
  ["O80", "Encounter for full-term uncomplicated delivery", "ولادة طبيعية", "Pregnancy"],
  ["Z00.0", "General medical examination", "فحص طبي عام", "Factors"],
  ["Z76.0", "Encounter for repeat prescription", "تجديد وصفة طبية", "Factors"],
  ["F41.1", "Generalised anxiety disorder", "اضطراب القلق العام", "Mental"],
  ["A09", "Gastroenteritis, presumed infectious", "التهاب معدي معوي", "Infectious"],
  ["A41.9", "Sepsis, unspecified", "تعفّن الدم", "Infectious"],
];

// generic, name, nameAr, form, strength, stock, reorderLevel, unitPrice
export const DRUGS: [string, string, string, string, string, number, number, number][] = [
  ["paracetamol", "Paracetamol", "باراسيتامول", "Tablet", "500 mg", 900, 200, 0.6],
  ["ibuprofen", "Ibuprofen", "إيبوبروفين", "Tablet", "400 mg", 420, 150, 1.1],
  ["diclofenac", "Diclofenac", "ديكلوفيناك", "Tablet", "50 mg", 60, 120, 1.4],
  ["amoxicillin", "Amoxicillin", "أموكسيسيلين", "Capsule", "500 mg", 380, 150, 1.6],
  ["amoxicillin-clavulanate", "Amoxicillin-Clavulanate", "أموكسيسيلين وكلافولانيك", "Tablet", "1 g", 210, 100, 4.2],
  ["azithromycin", "Azithromycin", "أزيثرومايسين", "Tablet", "500 mg", 140, 80, 6.5],
  ["clarithromycin", "Clarithromycin", "كلاريثرومايسين", "Tablet", "500 mg", 95, 60, 5.8],
  ["ceftriaxone", "Ceftriaxone", "سيفترياكسون", "Injection", "1 g", 160, 80, 9.5],
  ["metformin", "Metformin", "ميتفورمين", "Tablet", "1000 mg", 700, 250, 0.9],
  ["insulin-glargine", "Insulin glargine", "إنسولين جلارجين", "Pen", "100 U/mL", 36, 40, 78],
  ["atorvastatin", "Atorvastatin", "أتورفاستاتين", "Tablet", "20 mg", 520, 200, 2.2],
  ["amlodipine", "Amlodipine", "أملوديبين", "Tablet", "5 mg", 610, 200, 0.8],
  ["lisinopril", "Lisinopril", "ليسينوبريل", "Tablet", "10 mg", 330, 150, 1.3],
  ["losartan", "Losartan", "لوسارتان", "Tablet", "50 mg", 340, 150, 1.7],
  ["furosemide", "Furosemide", "فيوروسيميد", "Tablet", "40 mg", 250, 100, 0.7],
  ["warfarin", "Warfarin", "وارفارين", "Tablet", "5 mg", 120, 60, 1.9],
  ["aspirin", "Aspirin", "أسبرين", "Tablet", "81 mg", 800, 250, 0.3],
  ["clopidogrel", "Clopidogrel", "كلوبيدوغريل", "Tablet", "75 mg", 190, 80, 3.4],
  ["enoxaparin", "Enoxaparin", "إينوكسابارين", "Injection", "40 mg", 48, 50, 28],
  ["omeprazole", "Omeprazole", "أوميبرازول", "Capsule", "20 mg", 640, 200, 1.2],
  ["ondansetron", "Ondansetron", "أوندانسيترون", "Tablet", "4 mg", 180, 80, 2.5],
  ["salbutamol", "Salbutamol", "سالبيوتامول", "Inhaler", "100 mcg", 85, 60, 14],
  ["prednisolone", "Prednisolone", "بريدنيزولون", "Tablet", "5 mg", 300, 100, 0.8],
  ["loratadine", "Loratadine", "لوراتادين", "Tablet", "10 mg", 410, 120, 0.9],
  ["tramadol", "Tramadol", "ترامادول", "Capsule", "50 mg", 110, 60, 2.0],
];

export const INTERACTIONS: [string, string, string, string, string][] = [
  ["warfarin", "aspirin", "MAJOR", "خطر نزيف مرتفع عند الجمع بين وارفارين وأسبرين.", "Combining warfarin and aspirin raises bleeding risk significantly."],
  ["warfarin", "ibuprofen", "MAJOR", "مضادات الالتهاب تزيد النزيف وتتعارض مع وارفارين.", "NSAIDs increase bleeding and interfere with warfarin."],
  ["warfarin", "diclofenac", "MAJOR", "ديكلوفيناك يرفع خطر النزيف مع وارفارين.", "Diclofenac raises bleeding risk with warfarin."],
  ["warfarin", "clarithromycin", "MAJOR", "كلاريثرومايسين يرفع مستوى وارفارين في الدم.", "Clarithromycin raises warfarin levels."],
  ["warfarin", "azithromycin", "MODERATE", "قد يزداد تأثير وارفارين؛ يلزم قياس INR.", "Warfarin effect may increase; monitor INR."],
  ["atorvastatin", "clarithromycin", "MAJOR", "خطر اعتلال العضلات؛ يُنصح بإيقاف الستاتين مؤقتاً.", "Risk of myopathy; consider pausing the statin."],
  ["aspirin", "ibuprofen", "MODERATE", "إيبوبروفين قد يقلل الحماية القلبية للأسبرين.", "Ibuprofen may blunt the cardioprotective effect of aspirin."],
  ["clopidogrel", "omeprazole", "MODERATE", "أوميبرازول قد يقلل فعالية كلوبيدوغريل.", "Omeprazole may reduce clopidogrel effectiveness."],
  ["lisinopril", "losartan", "MODERATE", "الجمع بين مثبط ACE وحاصر مستقبلات الأنجيوتنسين يزيد خطر ارتفاع البوتاسيوم والفشل الكلوي.", "ACE inhibitor plus ARB raises risk of hyperkalaemia and renal injury."],
  ["lisinopril", "ibuprofen", "MODERATE", "مضادات الالتهاب قد تُضعف خافض الضغط وتؤذي الكلى.", "NSAIDs may blunt the antihypertensive and harm the kidneys."],
  ["enoxaparin", "aspirin", "MAJOR", "زيادة خطر النزيف عند الجمع بين مضادات التخثر والأسبرين.", "Increased bleeding risk combining anticoagulant and aspirin."],
  ["enoxaparin", "warfarin", "CONTRAINDICATED", "الجمع بين مضادين للتخثر دون إشراف متخصص ممنوع في هذا النظام.", "Dual anticoagulation without specialist supervision is blocked in this system."],
  ["tramadol", "ondansetron", "MODERATE", "قد يقلّ مفعول ترامادول المسكّن.", "Analgesic effect of tramadol may be reduced."],
  ["amlodipine", "clarithromycin", "MODERATE", "قد ينخفض الضغط انخفاضاً زائداً.", "Blood pressure may fall excessively."],
];

export const PACKAGES = [
  ["executive-checkup", "الفحص الشامل للبالغين", "Adult Executive Check-up", "فحص سنوي يغطي القلب والسكر والدهون والكبد والكلى مع استشارة باطنية وتقرير مفصل.", "An annual check covering heart, glucose, lipids, liver and kidneys with an internist consultation and a detailed report.", "تحاليل دم شاملة|تخطيط القلب|أشعة الصدر|قياس الضغط والوزن|استشارة باطنية", "Comprehensive blood panel|ECG|Chest X-ray|Blood pressure and weight|Internist consultation", 890, 690, "adults"],
  ["heart-health", "باقة صحة القلب", "Heart Health Package", "تقييم لعوامل خطر القلب مع اختبار جهد وإيكو واستشارة قلب.", "Cardiac risk assessment with stress test, echo and a cardiology consultation.", "تخطيط القلب|إيكو القلب|اختبار الجهد|دهون الدم|استشارة قلب", "ECG|Echocardiography|Stress test|Lipid profile|Cardiology consultation", 1450, null, "adults"],
  ["maternity-care", "باقة متابعة الحمل", "Maternity Care Package", "زيارات متابعة الحمل الشهرية وفحوص الثلث الأول والثاني والثالث وسونار.", "Monthly antenatal visits, trimester screening and ultrasounds.", "زيارات شهرية|سونار ثلاثي|فحوص الدم|تطعيمات الحمل|دورة تثقيفية", "Monthly visits|Three ultrasounds|Blood screening|Pregnancy vaccines|Antenatal class", 3200, 2800, "women"],
  ["child-wellness", "باقة صحة الطفل", "Child Wellness Package", "فحص نمو وتطعيمات وفحص نظر وسمع حتى سن الخامسة.", "Growth checks, vaccines, vision and hearing screening up to age five.", "متابعة النمو|التطعيمات|فحص النظر|فحص السمع|استشارة تغذية", "Growth monitoring|Vaccines|Vision test|Hearing test|Nutrition advice", 780, null, "children"],
  ["diabetes-care", "باقة رعاية السكري", "Diabetes Care Package", "متابعة ربع سنوية للسكري مع فحص العين والقدم والكلى وتثقيف غذائي.", "Quarterly diabetes follow-up with eye, foot and kidney screening and dietary education.", "السكر التراكمي|فحص العين|فحص القدم|وظائف الكلى|أخصائي تغذية", "HbA1c|Eye exam|Foot exam|Kidney function|Dietitian", 1100, 950, "adults"],
  ["women-wellness", "باقة صحة المرأة", "Women's Wellness Package", "فحص الثدي وعنق الرحم والهرمونات وهشاشة العظام مع استشارة نسائية.", "Breast, cervical, hormone and bone-density screening with a gynaecology consultation.", "ماموجرام|مسحة عنق الرحم|الهرمونات|كثافة العظام|استشارة نسائية", "Mammogram|Cervical smear|Hormones|Bone density|Gynaecology consultation", 1600, 1350, "women"],
] as const;

export const ARTICLE_CATEGORIES = [
  ["heart", "صحة القلب", "Heart Health"],
  ["diabetes", "السكري والتغذية", "Diabetes and Nutrition"],
  ["children", "صحة الطفل", "Child Health"],
  ["women", "صحة المرأة", "Women's Health"],
  ["wellbeing", "العافية ونمط الحياة", "Wellbeing and Lifestyle"],
] as const;

const NOTE_AR = "هذا المقال للتثقيف العام ولا يغني عن استشارة الطبيب.";
const NOTE_EN = "This article is general education and does not replace a doctor's advice.";

// slug, cat, titleAr, titleEn, excerptAr, excerptEn, paragraphs[ar], paragraphs[en], authorAr, authorEn, readMin, daysAgo
export const ARTICLES: [string, string, string, string, string, string, string[], string[], string, string, number, number][] = [
  ["chest-pain-when-to-go", "heart", "متى يكون ألم الصدر طارئاً؟", "When is chest pain an emergency?", "علامات تستدعي التوجه فوراً إلى الطوارئ وأخرى يمكن مراجعتها في العيادة.", "Signs that need the emergency room now, and others that can wait for a clinic visit.",
    ["ألم الصدر الضاغط الذي يمتد إلى الذراع أو الفك أو يصاحبه تعرق وضيق نفس يستدعي طلب الإسعاف فوراً ولا تقد السيارة بنفسك.", "الألم الحاد الذي يتغير مع التنفس أو الحركة غالباً عضلي، لكن لا تتجاهله إذا تكرر؛ احجز موعداً مع طبيب القلب لإجراء تخطيط وفحوص.", NOTE_AR],
    ["Pressing chest pain that spreads to the arm or jaw, or comes with sweating and breathlessness, needs an ambulance straight away. Do not drive yourself.", "Sharp pain that changes with breathing or movement is often muscular, but if it keeps returning book a cardiology visit for an ECG and tests.", NOTE_EN],
    "د. نورة الشهري", "Dr. Noura Al-Shehri", 4, 12],
  ["blood-pressure-home", "heart", "قياس ضغط الدم في المنزل بشكل صحيح", "Measuring blood pressure at home correctly", "خطوات بسيطة تجعل قراءتك أدق وتفيد طبيبك في ضبط العلاج.", "Simple steps that make your readings more accurate and useful to your doctor.",
    ["اجلس خمس دقائق بهدوء، وضع ذراعك على مستوى القلب، واستخدم سوار القياس بالحجم المناسب.", "قس مرتين صباحاً ومرتين مساءً لمدة أسبوع قبل الزيارة، وسجّل القيم في ورقة أو تطبيق وأحضرها معك.", NOTE_AR],
    ["Sit quietly for five minutes, rest your arm at heart level and use a cuff of the right size.", "Measure twice in the morning and twice in the evening for a week before your visit, write the values down and bring them along.", NOTE_EN],
    "د. خالد القحطاني", "Dr. Khalid Al-Qahtani", 3, 30],
  ["diabetes-plate", "diabetes", "طبق السكري: كيف توازن وجباتك؟", "The diabetes plate: balancing your meals", "قاعدة الطبق تساعدك على التحكم بالسكر دون حرمان.", "The plate method helps control glucose without deprivation.",
    ["املأ نصف الطبق بالخضار غير النشوية، وربعه بالبروتين، وربعه بالحبوب الكاملة، وأضف حصة فاكهة صغيرة.", "قلّل المشروبات المحلاة، وراقب أحجام التمر والخبز، واستشر أخصائي التغذية لوضع خطة تناسب أدويتك.", NOTE_AR],
    ["Fill half the plate with non-starchy vegetables, a quarter with protein, a quarter with whole grains and add a small portion of fruit.", "Cut sweetened drinks, watch portions of dates and bread, and ask a dietitian for a plan that fits your medication.", NOTE_EN],
    "أ. منى الزهراني", "Muna Al-Zahrani, RD", 5, 20],
  ["hba1c-explained", "diabetes", "ما معنى السكر التراكمي؟", "What does HbA1c mean?", "فحص يعكس متوسط السكر في آخر ثلاثة أشهر.", "A test reflecting average glucose over the last three months.",
    ["السكر التراكمي (HbA1c) يقيس نسبة السكر المرتبط بالهيموغلوبين، ويُجرى عادة كل ثلاثة إلى ستة أشهر لمرضى السكري.", "الهدف يختلف من شخص لآخر حسب العمر والأمراض المصاحبة، فلا تقارن نتيجتك بغيرك بل ناقشها مع طبيبك.", NOTE_AR],
    ["HbA1c measures the share of haemoglobin bound to glucose and is usually repeated every three to six months in people with diabetes.", "Targets differ by age and other conditions, so do not compare your result with others; discuss it with your doctor.", NOTE_EN],
    "د. هند الدوسري", "Dr. Hind Al-Dosari", 4, 45],
  ["child-fever", "children", "حمّى الطفل: ما الذي تفعله في المنزل؟", "Child fever: what to do at home", "متى تكفي الراحة والسوائل، ومتى يلزم الذهاب إلى الطوارئ.", "When rest and fluids are enough and when to go to the emergency room.",
    ["أعطِ الطفل سوائل كافية وملابس خفيفة، ويمكن استعمال خافض الحرارة بالجرعة المناسبة لوزنه.", "توجّه إلى الطوارئ إذا كان عمر الطفل أقل من ثلاثة أشهر وحرارته 38 درجة أو أكثر، أو ظهر خمول شديد أو طفح أو صعوبة تنفس.", NOTE_AR],
    ["Give plenty of fluids and light clothing; a fever reducer may be used at a dose matched to the child's weight.", "Go to the emergency room if the baby is under three months with a temperature of 38 degrees or more, or if there is marked drowsiness, a rash or difficulty breathing.", NOTE_EN],
    "د. سارة العتيبي", "Dr. Sarah Al-Otaibi", 4, 8],
  ["vaccine-schedule", "children", "جدول التطعيمات في السنة الأولى", "Vaccination schedule in the first year", "نظرة مبسطة على مواعيد التطعيمات الأساسية وأهميتها.", "A plain overview of core vaccine timing and why it matters.",
    ["تبدأ التطعيمات عند الولادة وتتكرر في الشهرين والأربعة والستة والتسعة، وفق جدول وزارة الصحة المعتمد.", "إذا فاتك موعد فلا داعي للقلق؛ يمكن استكمال الجدول بزيارة عيادة الأطفال دون البدء من جديد.", NOTE_AR],
    ["Vaccination starts at birth and continues at two, four, six and nine months following the approved national schedule.", "If you miss an appointment there is no need to worry; the schedule can be completed at the paediatric clinic without starting over.", NOTE_EN],
    "د. ريم الغامدي", "Dr. Reem Al-Ghamdi", 3, 60],
  ["antenatal-first-trimester", "women", "فحوص الثلث الأول من الحمل", "First-trimester antenatal checks", "أهم الفحوص والمكملات في الأسابيع الأولى.", "Key tests and supplements in the early weeks.",
    ["تشمل الزيارة الأولى فحص الدم وفصيلة الدم وسونار لتأكيد الحمل وعمره، وبدء حمض الفوليك.", "أخبري طبيبتك بأدويتك وأمراضك المزمنة، وتجنبي الأدوية دون استشارة.", NOTE_AR],
    ["The first visit includes blood tests, blood group and an ultrasound to confirm the pregnancy and dating, plus folic acid.", "Tell your doctor about all medicines and chronic conditions and avoid medicines without advice.", NOTE_EN],
    "د. لمى الحربي", "Dr. Lama Al-Harbi", 5, 15],
  ["breast-screening", "women", "الكشف المبكر عن سرطان الثدي", "Early breast cancer screening", "متى تبدئين الماموجرام وما الذي تتوقعينه؟", "When to start mammography and what to expect.",
    ["يُنصح بالفحص الذاتي الشهري، وبالماموجرام سنوياً أو كل سنتين بدءاً من الأربعين أو أبكر عند وجود تاريخ عائلي.", "الفحص سريع ولا يستغرق أكثر من عشرين دقيقة، ومعظم النتائج طبيعية؛ والاكتشاف المبكر يرفع فرص الشفاء.", NOTE_AR],
    ["Monthly self-checks are advised, with mammography every one to two years from age forty, or earlier with a family history.", "The scan takes about twenty minutes and most results are normal; early detection improves the chance of cure.", NOTE_EN],
    "د. غادة الشمري", "Dr. Ghada Al-Shammari", 4, 70],
  ["sleep-hygiene", "wellbeing", "عادات النوم الصحي", "Healthy sleep habits", "خمس عادات تحسّن جودة النوم دون أدوية.", "Five habits that improve sleep quality without medication.",
    ["حافظ على موعد ثابت للنوم والاستيقاظ، وأبعد الشاشات قبل النوم بساعة، وقلّل الكافيين بعد العصر.", "إذا استمر الأرق أكثر من ثلاثة أسابيع أو صاحبه شخير شديد وتوقف تنفس، راجع عيادة النوم.", NOTE_AR],
    ["Keep fixed sleep and wake times, avoid screens for an hour before bed and cut caffeine after mid-afternoon.", "If insomnia lasts over three weeks or comes with heavy snoring and pauses in breathing, see the sleep clinic.", NOTE_EN],
    "د. هشام السبيعي", "Dr. Hisham Al-Subaie", 3, 5],
  ["heat-hydration", "wellbeing", "الترطيب في الصيف الحار", "Staying hydrated in the hot summer", "كيف تحمي نفسك وأسرتك من الجفاف وضربة الشمس.", "How to protect yourself and your family from dehydration and heat stroke.",
    ["اشرب الماء بانتظام ولا تنتظر العطش، وتجنب الخروج وقت الذروة، وارتدِ ملابس فاتحة فضفاضة.", "الدوار الشديد والارتباك وجفاف الجلد مع حرارة عالية علامات طارئة تستدعي الإسعاف.", NOTE_AR],
    ["Drink water regularly without waiting for thirst, avoid peak hours outdoors and wear light loose clothing.", "Severe dizziness, confusion and dry skin with a high temperature are emergency signs that need an ambulance.", NOTE_EN],
    "أ. جود البلوي", "Joud Al-Balawi, RD", 3, 3],
];

export const NEWS = [
  ["new-heart-centre-wing", "افتتاح جناح جديد لقسطرة القلب في رُواء الرياض", "New cardiac catheterisation wing opens at Rowaa Riyadh", "غرفتا قسطرة حديثتان ترفعان الطاقة الاستيعابية للمركز.", "Two new cath labs increase the centre's capacity.", "أعلن مستشفى رُواء التخصصي افتتاح جناح جديد يضم غرفتي قسطرة وثماني أسرّة مراقبة، ضمن خطة لتقليل أوقات الانتظار للحالات القلبية.", "Rowaa Specialist Hospital opened a new wing with two catheterisation labs and eight monitored beds as part of a plan to shorten waits for cardiac cases.", 4],
  ["jeddah-eye-centre", "مركز العيون في جدة يستقبل المراجعين بتقنيات تصوير جديدة", "Jeddah eye centre welcomes patients with new imaging technology", "تصوير مقطعي للشبكية في زيارة واحدة.", "Retinal tomography in a single visit.", "بدأ مركز العيون في رُواء جدة تشغيل أجهزة تصوير حديثة تتيح فحص الشبكية والعصب البصري خلال زيارة واحدة.", "The eye centre at Rowaa Jeddah started using new imaging devices that allow retinal and optic-nerve assessment in one visit.", 10],
  ["khobar-ivf-programme", "برنامج جديد لدعم الأزواج في مركز الخصوبة بالخبر", "New couple-support programme at the Khobar fertility centre", "جلسات إرشاد نفسي مجانية مع كل دورة علاج.", "Free counselling sessions with every treatment cycle.", "أطلق مركز الخصوبة والإخصاب برنامجاً للدعم النفسي يرافق الزوجين في رحلة العلاج، بإشراف أخصائيين نفسيين.", "The fertility and IVF centre launched a psychological support programme that accompanies couples through treatment, led by psychologists.", 22],
  ["digital-results", "نتائج المختبر والأشعة متاحة الآن في بوابة المريض", "Lab and radiology results now available in the patient portal", "اطّلع على نتائجك ووصفاتك وفواتيرك من الجوال.", "See your results, prescriptions and invoices from your phone.", "أضافت رُواء إلى بوابة المريض عرض النتائج والوصفات والفواتير، مع إشعار عند اكتمال التحاليل.", "Rowaa added results, prescriptions and invoices to the patient portal, with a notice when tests are complete.", 35],
  ["health-fair", "رُواء تشارك في معرض الصحة المجتمعي", "Rowaa joins the community health fair", "فحوص مجانية للضغط والسكر على مدى ثلاثة أيام.", "Free blood pressure and glucose checks over three days.", "شاركت فرق رُواء في المعرض بفحوص مجانية للضغط والسكر وجلسات توعية عن الصحة الوقائية.", "Rowaa teams took part with free blood pressure and glucose checks and awareness talks on preventive health.", 50],
] as const;

export const JOBS = [
  ["staff-nurse-er", "ممرض/ة طوارئ", "Emergency Staff Nurse", "التمريض", "Nursing", "الرياض", "Riyadh", "دوام كامل", "رعاية الحالات الطارئة وإجراء الفرز التمريضي وفق إجراءات المستشفى.", "Emergency care and nurse triage under hospital protocols.", "بكالوريوس تمريض وترخيص ساري، خبرة سنتان في الطوارئ، شهادة إنعاش قلبي.", "Nursing degree and valid licence, two years' ER experience, BLS certificate."],
  ["lab-technologist", "أخصائي مختبر", "Medical Laboratory Technologist", "المختبر", "Laboratory", "جدة", "Jeddah", "دوام كامل", "تشغيل الأجهزة وإدخال النتائج ومراجعة القيم الحرجة.", "Operate analysers, enter results and review critical values.", "بكالوريوس مختبرات طبية وترخيص، معرفة بإدارة الجودة.", "Degree in medical laboratory science and licence, quality management knowledge."],
  ["pharmacist", "صيدلي إكلينيكي", "Clinical Pharmacist", "الصيدلية", "Pharmacy", "الرياض", "Riyadh", "دوام كامل", "مراجعة الوصفات والتداخلات الدوائية ودعم الأطباء.", "Review prescriptions and interactions and support physicians.", "ماجستير أو دكتور صيدلة وترخيص، خبرة في الصيدلة الإكلينيكية.", "PharmD or master's degree and licence, clinical pharmacy experience."],
  ["receptionist", "موظف/ة استقبال ومواعيد", "Reception and Appointments Officer", "خدمة المرضى", "Patient Services", "الخبر", "Khobar", "دوام جزئي", "تسجيل المرضى وإدارة المواعيد والرد على الاستفسارات.", "Register patients, manage appointments and answer enquiries.", "دبلوم أو بكالوريوس، مهارات تواصل ممتازة، إجادة الإنجليزية.", "Diploma or degree, excellent communication, good English."],
  ["radiographer", "فني أشعة", "Radiographer", "الأشعة", "Radiology", "الرياض", "Riyadh", "دوام كامل", "إجراء التصوير بالأشعة السينية والمقطعية وفق معايير السلامة.", "Perform X-ray and CT imaging under safety standards.", "بكالوريوس أشعة وترخيص، خبرة سنة على الأقل.", "Radiography degree and licence, at least one year's experience."],
  ["billing-analyst", "محلل فوترة ومطالبات", "Billing and Claims Analyst", "المالية", "Finance", "الرياض", "Riyadh", "دوام كامل", "إعداد المطالبات ومتابعة ردود شركات التأمين.", "Prepare claims and follow up payer responses.", "بكالوريوس محاسبة، خبرة في مطالبات التأمين الصحي.", "Accounting degree, health insurance claims experience."],
] as const;

export const COMPLAINTS_OPD: [string, string, string[], string[], string[]][] = [
  // complaint, dx code, labs, rads, rx generics
  ["متابعة ارتفاع ضغط الدم", "I10", ["CREA", "K"], [], ["amlodipine"]],
  ["متابعة السكري", "E11.9", ["HBA1C", "GLU"], [], ["metformin"]],
  ["التهاب في الحلق وسعال", "J02.9", [], [], ["amoxicillin", "paracetamol"]],
  ["ألم في الركبة", "M17.9", [], ["XR-WRIST"], ["ibuprofen", "omeprazole"]],
  ["حب الشباب", "L70.0", [], [], ["amoxicillin"]],
  ["ألم أسفل الظهر", "M54.5", [], ["MRI-LSP"], ["diclofenac", "omeprazole"]],
  ["حرقة في المعدة", "K21.9", [], [], ["omeprazole"]],
  ["فحص طبي عام", "Z00.0", ["HGB", "GLU", "ALT"], ["XR-CHEST"], []],
  ["صداع متكرر", "R51", [], [], ["paracetamol"]],
  ["حساسية موسمية", "J45.909", [], [], ["loratadine", "salbutamol"]],
  ["متابعة الغدة الدرقية", "E03.9", ["CRP"], [], []],
  ["التهاب بولي", "N39.0", ["WBC", "CREA"], [], ["amoxicillin-clavulanate"]],
];

export const DEFAULT_CONSULT_ER = 350;
