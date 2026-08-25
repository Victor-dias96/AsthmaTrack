type UserRole = "patient" | "medical";

const ROLE_LABELS: Record<UserRole, string> = {
  patient: "Paciente",
  medical: "Profissional de saúde",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? ROLE_LABELS.patient;
}
