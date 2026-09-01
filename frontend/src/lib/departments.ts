import { Utensils, Calculator, ConciergeBell, Sparkles, type LucideIcon } from "lucide-react";

export interface DepartmentDef {
  key: string;
  label: string;
  icon: LucideIcon;
}

// Mirrors App\Enums\Department on the backend — keep the four `key`s in sync
// with that enum's values.
export const DEPARTMENTS: DepartmentDef[] = [
  { key: "servis", label: "Servis (Garson)", icon: Utensils },
  { key: "muhasebe", label: "Muhasebe", icon: Calculator },
  { key: "resepsiyon", label: "Resepsiyon", icon: ConciergeBell },
  { key: "temizlik_tamir", label: "Temizlik & Tamir", icon: Sparkles },
];

export function getDepartment(key: string | null | undefined): DepartmentDef | undefined {
  return DEPARTMENTS.find((d) => d.key === key);
}
