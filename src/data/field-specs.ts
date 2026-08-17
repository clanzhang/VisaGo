// data/field-specs.ts — 材料字段规范（核对表单 + 缺失检测 + 文档必填共用）
// P0-1：字段类型化 —— occupation 等枚举字段渲染为受限选择，不再自由输入

export type FieldType = 'text' | 'enum' | 'date' | 'money' | 'phone'
export type FieldGroup = 'identity' | 'contact' | 'occupation'

export interface FieldSpec {
  key: string
  label: string
  required: boolean
  /** 控件类型：text / enum（受限选项）/ date / money（数字+单位+千分位）/ phone */
  type?: FieldType
  /** type === 'enum' 时的选项（value 为存储值，labelKey 为 i18n 文案 key） */
  options?: { value: string; labelKey: string }[]
  /** 语义分组（身份证件 / 联系方式 / 职业信息） */
  group?: FieldGroup
  /** 通常来源文件提示（该字段未提取到时展示，帮助用户知道去哪补） */
  sourceHint?: string
}

export const FIELD_SPECS: FieldSpec[] = [
  { key: 'name', label: '姓名', required: true, type: 'text', group: 'identity', sourceHint: 'scan.sourceHintName' },
  { key: 'passport_number', label: '护照号', required: true, type: 'text', group: 'identity', sourceHint: 'scan.sourceHintPassportNumber' },
  { key: 'id_number', label: '身份证号', required: true, type: 'text', group: 'identity', sourceHint: 'scan.sourceHintIdNumber' },
  { key: 'nationality', label: '国籍', required: true, type: 'text', group: 'identity', sourceHint: 'scan.sourceHintNationality' },
  { key: 'birth_date', label: '出生日期', required: true, type: 'date', group: 'identity', sourceHint: 'scan.sourceHintBirthDate' },
  { key: 'gender', label: '性别', required: false, type: 'enum', group: 'identity', options: [
    { value: '男', labelKey: 'scan.genderMale' },
    { value: '女', labelKey: 'scan.genderFemale' },
  ] },
  { key: 'phone', label: '手机号', required: false, type: 'phone', group: 'contact', sourceHint: 'scan.sourceHintPhone' },
  { key: 'address', label: '家庭住址', required: false, type: 'text', group: 'contact', sourceHint: 'scan.sourceHintAddress' },
  { key: 'home_province', label: '户籍省份', required: true, type: 'text', group: 'contact', sourceHint: 'scan.sourceHintHomeProvince' },
  { key: 'passport_issued_in', label: '护照签发地', required: false, type: 'text', group: 'identity', sourceHint: 'scan.sourceHintIssuedIn' },
  { key: 'occupation', label: '职业', required: true, type: 'enum', group: 'occupation', options: [
    { value: 'employed', labelKey: 'documents.occupationEmployed' },
    { value: 'student', labelKey: 'documents.occupationStudent' },
    { value: 'retired', labelKey: 'documents.occupationRetired' },
    { value: 'freelance', labelKey: 'documents.occupationFreelance' },
  ] },
  { key: 'company', label: '工作单位', required: false, type: 'text', group: 'occupation', sourceHint: 'scan.sourceHintCompany' },
  { key: 'position', label: '职位', required: false, type: 'text', group: 'occupation', sourceHint: 'scan.sourceHintPosition' },
  { key: 'salary', label: '月薪', required: false, type: 'money', group: 'occupation', sourceHint: 'scan.sourceHintSalary' },
]

export const OCCUPATION_VALUES = ['employed', 'student', 'retired', 'freelance'] as const
export type OccupationValue = (typeof OCCUPATION_VALUES)[number]

/**
 * P0-4：生成某类文档所必需的字段（缺失时生成前提示，避免带占位符的残缺文档）。
 * 与 lib/doc-generator 消费的字段一致（在职证明需要公司/职位/月薪等）。
 */
export const DOC_REQUIRED_FIELDS: Record<'itinerary' | 'employment' | 'cover', string[]> = {
  employment: ['name', 'company', 'position', 'salary', 'home_province'],
  itinerary: ['name', 'passport_number', 'nationality'],
  cover: ['name', 'passport_number', 'nationality', 'address'],
}
