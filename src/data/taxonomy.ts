// Starting skills and cities. Admins can add or edit more in the admin panel (Taxonomy group).

export const CATEGORIES: { name: string; icon: string; skills: string[] }[] = [
  { name: 'Frontend', icon: 'layout', skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Nuxt', 'Angular', 'Svelte', 'Tailwind CSS', 'Sass', 'Redux', 'Vite', 'Webpack', 'Web Accessibility', 'Web Performance'] },
  { name: 'Backend', icon: 'server', skills: ['Node.js', 'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask', 'Java', 'Spring Boot', 'PHP', 'Laravel', 'C# and .NET', 'Go', 'Ruby on Rails', 'REST APIs', 'GraphQL', 'Microservices', 'Authentication (OAuth, JWT)', 'WebSockets'] },
  { name: 'Mobile', icon: 'smartphone', skills: ['React Native', 'Flutter', 'Swift', 'SwiftUI', 'Kotlin', 'Android', 'iOS', 'Ionic'] },
  { name: 'Databases', icon: 'database', skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'SQL', 'Elasticsearch', 'Prisma', 'Database Design'] },
  { name: 'DevOps and Cloud', icon: 'cloud', skills: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'CI/CD', 'GitHub Actions', 'Terraform', 'Linux', 'Nginx', 'Ansible', 'Monitoring'] },
  { name: 'Data and AI', icon: 'brain', skills: ['Python', 'SQL', 'Pandas', 'Data Analysis', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'LLMs', 'Power BI', 'Tableau', 'Apache Spark', 'Excel'] },
  { name: 'QA and Testing', icon: 'bug', skills: ['Manual Testing', 'Test Automation', 'Jest', 'Vitest', 'Playwright', 'Cypress', 'Selenium', 'Postman'] },
  { name: 'UI/UX Design', icon: 'palette', skills: ['Figma', 'Wireframing', 'Prototyping', 'User Research', 'Design Systems', 'Adobe XD', 'Photoshop', 'Illustrator'] },
  { name: 'Cybersecurity', icon: 'shield', skills: ['Network Security', 'Penetration Testing', 'OWASP', 'Cryptography', 'SIEM', 'Incident Response'] },
  { name: 'Product and Management', icon: 'kanban', skills: ['Agile and Scrum', 'Jira', 'Product Management', 'Project Management', 'Business Analysis'] },
  { name: 'Soft skills', icon: 'users', skills: ['Communication', 'Teamwork', 'Problem Solving', 'Leadership', 'Time Management'] },
  { name: 'Languages', icon: 'languages', skills: ['Arabic', 'French', 'English', 'Spanish', 'German'] },
]

// Other spellings people type. Matching ignores case, accents, spaces, dots and dashes,
// so "node js" already matches "Node.js" without an alias.
export const SKILL_ALIASES: Record<string, string[]> = {
  JavaScript: ['js', 'ecmascript', 'es6'],
  TypeScript: ['ts'],
  React: ['reactjs', 'react js'],
  'Next.js': ['next', 'nextjs'],
  'Vue.js': ['vue', 'vuejs'],
  'Tailwind CSS': ['tailwind'],
  'Node.js': ['node', 'nodejs'],
  Express: ['expressjs'],
  Go: ['golang'],
  'C# and .NET': ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
  'Ruby on Rails': ['rails', 'ruby'],
  'REST APIs': ['rest', 'rest api', 'restful'],
  'Authentication (OAuth, JWT)': ['oauth', 'jwt', 'authentication'],
  'React Native': ['react-native'],
  PostgreSQL: ['postgres', 'psql'],
  MongoDB: ['mongo'],
  'Google Cloud': ['gcp'],
  'CI/CD': ['ci-cd', 'cicd', 'continuous integration'],
  'Machine Learning': ['ml', 'machine-learning'],
  'Deep Learning': ['dl'],
  NLP: ['natural language processing'],
  LLMs: ['llm', 'large language models', 'genai'],
  'Power BI': ['powerbi', 'power-bi'],
  'Apache Spark': ['spark', 'pyspark'],
  'Test Automation': ['test-automation', 'automated testing'],
  'User Research': ['user-research', 'ux research'],
  'Design Systems': ['design-systems'],
  'Agile and Scrum': ['agile', 'scrum'],
  'Product Management': ['product manager'],
  Arabic: ['arabe', 'العربية'],
  French: ['francais', 'français', 'الفرنسية'],
  English: ['anglais', 'الإنجليزية'],
}

// Shown first in pickers and as quick links
export const POPULAR_SKILLS = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'Docker', 'Figma', 'Java', 'PHP', 'Flutter', 'Excel']

// The 58 wilayas of Algeria: English name, French name, Arabic name
const WILAYAS: [string, string, string][] = [
  ['Adrar', 'Adrar', 'أدرار'], ['Chlef', 'Chlef', 'الشلف'], ['Laghouat', 'Laghouat', 'الأغواط'],
  ['Oum El Bouaghi', 'Oum El Bouaghi', 'أم البواقي'], ['Batna', 'Batna', 'باتنة'], ['Bejaia', 'Béjaïa', 'بجاية'],
  ['Biskra', 'Biskra', 'بسكرة'], ['Bechar', 'Béchar', 'بشار'], ['Blida', 'Blida', 'البليدة'],
  ['Bouira', 'Bouira', 'البويرة'], ['Tamanrasset', 'Tamanrasset', 'تمنراست'], ['Tebessa', 'Tébessa', 'تبسة'],
  ['Tlemcen', 'Tlemcen', 'تلمسان'], ['Tiaret', 'Tiaret', 'تيارت'], ['Tizi Ouzou', 'Tizi Ouzou', 'تيزي وزو'],
  ['Algiers', 'Alger', 'الجزائر'], ['Djelfa', 'Djelfa', 'الجلفة'], ['Jijel', 'Jijel', 'جيجل'],
  ['Setif', 'Sétif', 'سطيف'], ['Saida', 'Saïda', 'سعيدة'], ['Skikda', 'Skikda', 'سكيكدة'],
  ['Sidi Bel Abbes', 'Sidi Bel Abbès', 'سيدي بلعباس'], ['Annaba', 'Annaba', 'عنابة'], ['Guelma', 'Guelma', 'قالمة'],
  ['Constantine', 'Constantine', 'قسنطينة'], ['Medea', 'Médéa', 'المدية'], ['Mostaganem', 'Mostaganem', 'مستغانم'],
  ["M'Sila", "M'Sila", 'المسيلة'], ['Mascara', 'Mascara', 'معسكر'], ['Ouargla', 'Ouargla', 'ورقلة'],
  ['Oran', 'Oran', 'وهران'], ['El Bayadh', 'El Bayadh', 'البيض'], ['Illizi', 'Illizi', 'إليزي'],
  ['Bordj Bou Arreridj', 'Bordj Bou Arréridj', 'برج بوعريريج'], ['Boumerdes', 'Boumerdès', 'بومرداس'],
  ['El Tarf', 'El Tarf', 'الطارف'], ['Tindouf', 'Tindouf', 'تندوف'], ['Tissemsilt', 'Tissemsilt', 'تيسمسيلت'],
  ['El Oued', 'El Oued', 'الوادي'], ['Khenchela', 'Khenchela', 'خنشلة'], ['Souk Ahras', 'Souk Ahras', 'سوق أهراس'],
  ['Tipaza', 'Tipaza', 'تيبازة'], ['Mila', 'Mila', 'ميلة'], ['Ain Defla', 'Aïn Defla', 'عين الدفلى'],
  ['Naama', 'Naâma', 'النعامة'], ['Ain Temouchent', 'Aïn Témouchent', 'عين تموشنت'], ['Ghardaia', 'Ghardaïa', 'غرداية'],
  ['Relizane', 'Relizane', 'غليزان'], ['Timimoun', 'Timimoun', 'تيميمون'], ['Bordj Badji Mokhtar', 'Bordj Badji Mokhtar', 'برج باجي مختار'],
  ['Ouled Djellal', 'Ouled Djellal', 'أولاد جلال'], ['Beni Abbes', 'Béni Abbès', 'بني عباس'], ['In Salah', 'In Salah', 'عين صالح'],
  ['In Guezzam', 'In Guezzam', 'عين قزام'], ['Touggourt', 'Touggourt', 'تقرت'], ['Djanet', 'Djanet', 'جانت'],
  ["El M'Ghair", "El M'Ghair", 'المغير'], ['El Meniaa', 'El Menia', 'المنيعة'],
]

// Large cities that are not wilaya capitals: [name, wilaya, Arabic name]
const CITIES: [string, string, string][] = [
  ['Bab Ezzouar', 'Algiers', 'باب الزوار'], ['Dar El Beida', 'Algiers', 'الدار البيضاء'], ['Rouiba', 'Algiers', 'الرويبة'],
  ['Bir El Djir', 'Oran', 'بئر الجير'], ['El Eulma', 'Setif', 'العلمة'], ['Bou Saada', "M'Sila", 'بوسعادة'],
]

const INTERNATIONAL: [string, string, string[]][] = [
  ['Paris', 'France', []], ['Lyon', 'France', []], ['Marseille', 'France', []], ['Montreal', 'Canada', ['montréal']],
  ['Dubai', 'United Arab Emirates', ['دبي']], ['Tunis', 'Tunisia', ['تونس']], ['Casablanca', 'Morocco', ['الدار البيضاء المغرب']],
  ['London', 'United Kingdom', ['londres']], ['Berlin', 'Germany', []],
]

export type LocationSeed = { name: string; country: string; region?: string; aliases: string[]; isRemote?: boolean; order: number }

export const LOCATIONS: LocationSeed[] = [
  { name: 'Remote', country: 'Anywhere', aliases: ['remote', 'télétravail', 'teletravail', 'à distance', 'عن بعد'], isRemote: true, order: 0 },
  ...WILAYAS.map(([name, fr, ar], i) => ({
    name,
    country: 'Algeria',
    region: name,
    // Wilaya codes (01-58) are often typed too
    aliases: [fr, ar, String(i + 1).padStart(2, '0')].filter((a) => a !== name),
    order: 10 + i,
  })),
  ...CITIES.map(([name, region, ar]) => ({ name, country: 'Algeria', region, aliases: [ar], order: 80 })),
  ...INTERNATIONAL.map(([name, country, aliases]) => ({ name, country, aliases, order: 90 })),
]
