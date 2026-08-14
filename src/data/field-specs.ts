// data/field-specs.ts — 材料字段规范（核对表单 + 缺失检测共用）
export interface FieldSpec {
  key: string
  label: string
  required: boolean
}

export const FIELD_SPECS: FieldSpec[] = [
  { key: 'name', label: '姓名', required: true },
  { key: 'passport_number', label: '护照号', required: true },
  { key: 'id_number', label: '身份证号', required: true },
  { key: 'nationality', label: '国籍', required: true },
  { key: 'birth_date', label: '出生日期', required: true },
  { key: 'gender', label: '性别', required: false },
  { key: 'phone', label: '手机号', required: false },
  { key: 'address', label: '家庭住址', required: false },
  { key: 'home_province', label: '户籍省份', required: true },
  { key: 'passport_issued_in', label: '护照签发地', required: false },
  { key: 'occupation', label: '职业', required: true },
  { key: 'company', label: '工作单位', required: false },
  { key: 'position', label: '职位', required: false },
  { key: 'salary', label: '月薪', required: false },
]
