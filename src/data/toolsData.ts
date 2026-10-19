import { ToolItem } from '../types';

export const TOOLS_DATA: ToolItem[] = [
  // Organize
  {
    id: 'merge',
    title: 'دمج ملفات PDF',
    description: 'ادمج عدة مستندات PDF في ملف واحد منظم مع التحكم الكامل في ترتيب الملفات.',
    category: 'organize',
    iconName: 'Combine',
    badge: 'شائع',
    offlineReady: true,
  },
  {
    id: 'split',
    title: 'تقسيم PDF',
    description: 'قسّم المستند حسب نطاقات صفحات محددة (مثل: 1-3, 5, 8-10) أو استخرج صفحات معينة.',
    category: 'organize',
    iconName: 'Scissors',
    offlineReady: true,
  },
  {
    id: 'reorder',
    title: 'تنظيم وتدوير الصفحات',
    description: 'أعد ترتيب الصفحات بالسحب والإفلات، أو دوّرها بزوايا 90°/180°/270°، أو احذف ما لا تحتاجه.',
    category: 'organize',
    iconName: 'LayoutGrid',
    offlineReady: true,
  },

  // Edit & Annotate
  {
    id: 'edit_annotate',
    title: 'إضافة نصوص وأشكال',
    description: 'أضف نصوصاً وملاحظات وأشكالاً هندسية مستطيلة وأسهم فوق صفحات المستند.',
    category: 'edit',
    iconName: 'FileEdit',
    offlineReady: true,
  },
  {
    id: 'watermark',
    title: 'إضافة علامة مائية',
    description: 'أضف علامات مائية نصية مخصصة لحماية الملكية الفكرية، مع التحكم في الشفافية والموضع والزاوية.',
    category: 'edit',
    iconName: 'Stamp',
    offlineReady: true,
  },
  {
    id: 'page_numbers',
    title: 'ترقيم الصفحات',
    description: 'أدرج أرقام الصفحات بتنسيقات متعددة في أعلى أو أسفل الصفحة يميناً أو يساراً أو في المنتصف.',
    category: 'edit',
    iconName: 'ListOrdered',
    offlineReady: true,
  },
  {
    id: 'visual_cover',
    title: 'تغطية بصرية للمعلومات',
    description: 'تغطية بصرية للمناطق الحساسة بمربعات بيضاء أو سوداء (تنبيه: لا يحذف النص الأصلي من طبقات الملف العميقة).',
    category: 'edit',
    iconName: 'EyeOff',
    offlineReady: true,
  },

  // Sign & Fill
  {
    id: 'sign',
    title: 'التوقيع وتعبئة النماذج',
    description: 'ارسم توقيعك بالقلم أو الفأرة أو ارفع صورة توقيعك وضعه في أي مكان مع ختم التاريخ والاسم.',
    category: 'security',
    iconName: 'PenTool',
    badge: 'مهم',
    offlineReady: true,
  },

  // Convert
  {
    id: 'img_to_pdf',
    title: 'تحويل الصور إلى PDF',
    description: 'حوّل صور JPG وPNG المتعددة إلى مستند PDF واحد أنيق عالي الجودة مع الحفاظ على الأبعاد.',
    category: 'convert',
    iconName: 'Image',
    offlineReady: true,
  },
  {
    id: 'pdf_to_img',
    title: 'تحويل PDF إلى صور',
    description: 'استخرج جميع صفحات PDF أو بعضها كصور PNG أو JPG عالية الدقة مع إمكانية التنزيل كأرشيف ZIP.',
    category: 'convert',
    iconName: 'FileImage',
    offlineReady: true,
  },
  {
    id: 'extract_text',
    title: 'استخراج النصوص (TXT)',
    description: 'استخرج النصوص القابلة للنسخ من صفحات المستند بضغطة واحدة وانسخها أو نزلها كملف TXT.',
    category: 'convert',
    iconName: 'FileText',
    offlineReady: true,
  },
  {
    id: 'text_to_pdf',
    title: 'إنشاء PDF من نص',
    description: 'اكتب نصك الخاص وأنشئ ملف PDF جديداً ومنسقاً بعناوين وهوامش جاهز للطباعة والمشاركة.',
    category: 'convert',
    iconName: 'PlusSquare',
    offlineReady: true,
  },

  // Compress
  {
    id: 'compress',
    title: 'ضغط وتصغير PDF',
    description: 'قلل حجم ملف PDF مع خيارات لجودة المستند وحساب نسبة التوفير الفعلية قبل وبعد التنزيل.',
    category: 'organize',
    iconName: 'Minimize2',
    offlineReady: true,
  },

  // OCR
  {
    id: 'ocr',
    title: 'التعرف الضوئي العربي (OCR)',
    description: 'استخرج النصوص من المستندات المصورة والممسوحة ضوئياً بدعم كامل للغة العربية والإنجليزية.',
    category: 'assistant',
    iconName: 'ScanText',
    badge: 'متقدم',
    offlineReady: false, // requires downloading tesseract model on first run
  },

  // Local Assistant
  {
    id: 'assistant',
    title: 'المساعد الذكي للمستندات',
    description: 'تحليل محلي فوري للمستند: تلخيص المحتوى، استخراج الأرقام والتواريخ والإيميلات، إحصاءات الكلمات والصفحات، وإجابة الأسئلة.',
    category: 'assistant',
    iconName: 'Sparkles',
    badge: 'محلي 100%',
    offlineReady: true,
  },
];
