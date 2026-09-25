import type { MedicalPatientHistoryRecord } from "../types/medical-patient-history";
import { MedicalPatientHistoryRecordItem } from "./medical-patient-history-record-item";

type MedicalPatientHistoryRecordListProps = {
  records: readonly MedicalPatientHistoryRecord[];
};

export function MedicalPatientHistoryRecordList({
  records,
}: MedicalPatientHistoryRecordListProps) {
  return (
    <ul aria-label="Registros do período" className="min-w-0 space-y-4">
      {records.map((record, index) => (
        <li key={`${record.recordedAt}-${index}`} className="min-w-0">
          <MedicalPatientHistoryRecordItem record={record} />
        </li>
      ))}
    </ul>
  );
}
