import html2pdf from 'html2pdf.js';

export interface PdfExportOptions {
  filename?: string;
  marginMm?: [number, number, number, number]; // [top, left, bottom, right]
  title?: string;
}

/**
 * Eksportuje wskazany element DOM do profesjonalnego pliku PDF A4 i wywołuje natychmiastowe pobranie na dysk.
 */
export async function downloadPdfFromElement(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<void> {
  const filename = options.filename || 'Wniosek_Grantowy_ROPS.pdf';
  const marginMm = options.marginMm ?? [10, 10, 10, 10];

  // Konfiguracja html2pdf zoptymalizowana pod dokumenty A4 i ostre polskie czcionki
  const opt = {
    margin: marginMm,
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    enableLinks: true,
    html2canvas: {
      scale: 2, // Skalowanie 2x zapewnia jakość druku 200-300 DPI
      useCORS: true,
      letterRendering: true,
      scrollY: 0,
      scrollX: 0,
      backgroundColor: '#ffffff'
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      avoid: ['.pdf-avoid-break', 'tr', 'h3', 'h4', '.official-signature-box', '.official-header']
    }
  };

  // Bezpieczne wywołanie dla środowisk ESM / Vite
  const exporter = (typeof html2pdf === 'function' ? html2pdf : (html2pdf as any).default || html2pdf);
  
  await exporter().set(opt).from(element).save();
}
