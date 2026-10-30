import { MAIN_CONTENT_ID } from "./main-content";

export function SkipToContentLink() {
  return (
    <a href={`#${MAIN_CONTENT_ID}`} className="skip-to-content report-print-hidden">
      Pular para o conteúdo
    </a>
  );
}
