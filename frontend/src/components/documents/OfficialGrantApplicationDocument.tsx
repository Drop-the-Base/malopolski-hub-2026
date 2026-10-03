import React from 'react';
import { GrantApplication } from '../../types';
import { formatPLN } from '../../constants/domain';
import { CheckCircle2, ShieldAlert, Award, FileText } from 'lucide-react';

export interface OfficialGrantApplicationDocumentProps {
  application: GrantApplication;
  documentRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Oficjalny, urzędowy arkusz wniosku grantowego w standardzie A4 dla Regionalnego Ośrodka Polityki Społecznej w Krakowie.
 * Zaprojektowany z zachowaniem wymogów formalnych administracji publicznej Województwa Małopolskiego.
 */
export const OfficialGrantApplicationDocument: React.FC<OfficialGrantApplicationDocumentProps> = ({
  application,
  documentRef
}) => {
  const total = application.total_budget_pln || 1;

  return (
    <div
      ref={documentRef}
      id="official-grant-document"
      className="official-grant-document bg-white text-slate-900 border border-slate-300 shadow-xl p-8 sm:p-14 max-w-4xl mx-auto my-6 print:border-none print:shadow-none print:m-0 print:p-0 print:max-w-none print:w-full print:text-black font-sans leading-relaxed"
      style={{ minHeight: '297mm' }}
    >
      {/* 1. NAGŁÓWEK INSTYTUCJONALNY ROPS MAŁOPOLSKA */}
      <header className="official-header border-b-2 border-slate-900 pb-5 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Herb i identyfikacja Urzędu */}
          <div className="flex items-center gap-4">
            {/* Stylizowany Herb Województwa Małopolskiego */}
            <div className="w-16 h-20 bg-rose-700 text-white rounded-b-2xl border-2 border-slate-900 flex flex-col items-center justify-center p-1.5 shadow-sm shrink-0 print:border-black">
              <div className="text-[9px] font-black tracking-widest uppercase text-amber-300 text-center leading-none mb-1">
                Herb
              </div>
              <svg viewBox="0 0 24 24" className="w-9 h-9 fill-current text-white" aria-hidden="true">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.13-2.67 7.97-6 9.07-3.33-1.1-6-4.94-6-9.07V6.43l6-2.25zM11 7h2v2h-2zm0 3h2v5h-2z" />
              </svg>
              <div className="text-[7px] font-bold tracking-tight text-center text-rose-100 uppercase mt-0.5">
                Małopolska
              </div>
            </div>

            <div>
              <span className="text-xs font-black tracking-wider uppercase text-blue-900 block print:text-black">
                Województwo Małopolskie
              </span>
              <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight leading-snug">
                Regionalny Ośrodek Polityki Społecznej w Krakowie
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                ul. Piastowska 32, 30-070 Kraków · Wydział Innowacji Społecznych i Dostępności
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                System: Małopolski Hub Innowacji Społecznych (MHIS) · Nabór ROPS 2026
              </p>
            </div>
          </div>

          {/* Ramka Kancelaryjna / Metryka ewidencyjna */}
          <div className="bg-slate-50 border-2 border-slate-800 p-3 rounded-md text-xs w-full sm:w-64 shrink-0 print:bg-white print:border-black">
            <div className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-1.5 flex justify-between items-center">
              <span>KARTA EWIDENCYJNA</span>
              <span className="text-[10px] font-mono bg-blue-100 text-blue-900 px-1 rounded font-bold print:border print:border-black">ROPS</span>
            </div>
            <dl className="space-y-1 text-[11px]">
              <div>
                <dt className="inline text-slate-500">Nr wniosku: </dt>
                <dd className="inline font-mono font-black text-slate-950">ROPS/IWS/{application.application_id}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Data złożenia: </dt>
                <dd className="inline font-bold text-slate-900">{application.submission_date}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Kompletność: </dt>
                <dd className="inline font-bold text-emerald-800 print:text-black">{application.completeness_pct}% (Wymóg spełniony)</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Status: </dt>
                <dd className="inline font-bold text-amber-900 print:text-black">Zgłoszenie grantowe (Pilotaż)</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Belka barw regionalnych Małopolski (Niebieski - Złoty - Czerwony) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-900 via-amber-400 to-rose-700 mt-4 rounded-full print:bg-slate-900" />
      </header>

      {/* TYTUŁ DOKUMENTU */}
      <div className="text-center my-6 pb-4 border-b border-slate-200">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 block mb-1">
          Formularz aplikacyjny o powierzenie grantu na realizację innowacji społecznej
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
          WNIOSEK GRANTOWY
        </h2>
        <p className="text-sm font-semibold text-blue-950 mt-1 max-w-2xl mx-auto print:text-black">
          {application.call_title}
        </p>
      </div>

      {/* CZĘŚĆ I: IDENTYFIKACJA WNIOSKODAWCY I PRZEDSIĘWZIĘCIA */}
      <section className="mb-6 pdf-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-3 print:bg-slate-200 print:border-black">
          Część I: Identyfikacja Wnioskodawcy i Przedsięwzięcia
        </h3>
        <table className="w-full text-xs border border-slate-300">
          <tbody className="divide-y divide-slate-200">
            <tr>
              <th scope="row" className="w-1/3 bg-slate-50 p-2.5 text-left font-bold text-slate-700 border-r border-slate-300 print:bg-slate-100">
                1.1 Tytuł projektu innowacji
              </th>
              <td className="p-2.5 font-bold text-slate-950 text-sm">
                {application.idea_title}
              </td>
            </tr>
            <tr>
              <th scope="row" className="bg-slate-50 p-2.5 text-left font-bold text-slate-700 border-r border-slate-300 print:bg-slate-100">
                1.2 Nazwa Wnioskodawcy
              </th>
              <td className="p-2.5 font-bold text-slate-900">
                {application.applicant_name || 'Obywatelska Grupa Inicjatywna / Podmiot Partnerski'}
              </td>
            </tr>
            <tr>
              <th scope="row" className="bg-slate-50 p-2.5 text-left font-bold text-slate-700 border-r border-slate-300 print:bg-slate-100">
                1.3 Obszar realizacji w Małopolsce
              </th>
              <td className="p-2.5 text-slate-900">
                {application.gmina ? `Gmina: ${application.gmina}, ` : ''}Powiat: <span className="font-semibold">{application.powiat}</span> (Województwo Małopolskie)
              </td>
            </tr>
            <tr>
              <th scope="row" className="bg-slate-50 p-2.5 text-left font-bold text-slate-700 border-r border-slate-300 print:bg-slate-100">
                1.4 Grupa docelowa (beneficjenci)
              </th>
              <td className="p-2.5 text-slate-900 font-medium">
                {application.target_group}
              </td>
            </tr>
            <tr>
              <th scope="row" className="bg-slate-50 p-2.5 text-left font-bold text-slate-700 border-r border-slate-300 print:bg-slate-100">
                1.5 Wnioskowana kwota dofinansowania
              </th>
              <td className="p-2.5 font-mono font-black text-blue-900 text-sm print:text-black">
                {formatPLN(application.total_budget_pln)} (100% kosztów kwalifikowalnych grantu)
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* CZĘŚĆ II: DIAGNOZA SPOŁECZNA I UZASADNIENIE PROJEKTU */}
      <section className="mb-6 pdf-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-3 print:bg-slate-200 print:border-black">
          Część II: Diagnoza Społeczna i Uzasadnienie Potrzeby Realizacji
        </h3>
        <div className="space-y-3 text-xs leading-relaxed text-slate-800">
          <div className="border border-slate-200 rounded p-3 bg-slate-50/50 print:bg-transparent">
            <h4 className="font-bold text-slate-900 mb-1 uppercase text-[11px] tracking-wide">
              2.1 Streszczenie menedżerskie innowacji (Executive Summary)
            </h4>
            <p className="text-justify">{application.executive_summary}</p>
          </div>
          <div className="border border-slate-200 rounded p-3 bg-slate-50/50 print:bg-transparent">
            <h4 className="font-bold text-slate-900 mb-1 uppercase text-[11px] tracking-wide">
              2.2 Diagnoza problemu i specyfika regionalna
            </h4>
            <p className="text-justify">{application.problem_diagnosis}</p>
          </div>
        </div>
      </section>

      {/* CZĘŚĆ III: METODOLOGIA, PLAN PILOTAŻU I PARTNERSTWO */}
      <section className="mb-6 pdf-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-3 print:bg-slate-200 print:border-black">
          Część III: Metodologia, Plan Działań Pilotażowych i Partnerstwo Lokalne
        </h3>
        <div className="border border-slate-200 rounded p-3 bg-slate-50/50 text-xs leading-relaxed text-slate-800 print:bg-transparent">
          <h4 className="font-bold text-slate-900 mb-1 uppercase text-[11px] tracking-wide">
            3.1 Szczegółowy model wdrożenia i harmonogram pilotażu
          </h4>
          <p className="text-justify">{application.detailed_methodology}</p>
        </div>
      </section>

      {/* CZĘŚĆ IV: SZCZEGÓŁOWY KOSZTORYS PROJEKTU (TABELA A4) */}
      <section className="mb-6 pdf-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-3 print:bg-slate-200 print:border-black">
          Część IV: Kosztorys Projektu i Podział Budżetu Grantu
        </h3>
        <table className="w-full text-xs border border-slate-300">
          <caption className="sr-only">Tabela podziału budżetu grantu</caption>
          <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 print:bg-slate-200">
            <tr>
              <th scope="col" className="p-2 text-center w-12 border-r border-slate-300">Lp.</th>
              <th scope="col" className="p-2 text-left border-r border-slate-300">Kategoria wydatków kwalifikowalnych</th>
              <th scope="col" className="p-2 text-right w-24 border-r border-slate-300">Udział (%)</th>
              <th scope="col" className="p-2 text-right w-36">Wartość brutto (PLN)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {Object.entries(application.budget_breakdown).map(([category, amount], idx) => {
              const pct = ((amount / total) * 100).toFixed(1);
              return (
                <tr key={category} className="hover:bg-slate-50">
                  <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-300">{idx + 1}</td>
                  <td className="p-2 font-medium text-slate-900 border-r border-slate-300">{category}</td>
                  <td className="p-2 text-right font-mono text-slate-600 border-r border-slate-300">{pct}%</td>
                  <td className="p-2 text-right font-mono font-bold text-slate-950">{formatPLN(amount)}</td>
                </tr>
              );
            })}
            <tr className="bg-amber-50 font-black text-slate-950 border-t-2 border-slate-900 print:bg-slate-200">
              <td colSpan={2} className="p-2.5 text-left uppercase tracking-wide border-r border-slate-300">
                Łączny budżet projektu (Wnioskowane dofinansowanie ROPS)
              </td>
              <td className="p-2.5 text-right font-mono border-r border-slate-300">100.0%</td>
              <td className="p-2.5 text-right font-mono text-sm text-blue-950 print:text-black">
                {formatPLN(application.total_budget_pln)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* CZĘŚĆ V: PLANOWANE WSKAŹNIKI REZULTATU */}
      <section className="mb-6 pdf-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-3 print:bg-slate-200 print:border-black">
          Część V: Wskaźniki Rezultatu i Mierzalność Innowacji
        </h3>
        <table className="w-full text-xs border border-slate-300">
          <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 print:bg-slate-200">
            <tr>
              <th scope="col" className="p-2 text-center w-12 border-r border-slate-300">Lp.</th>
              <th scope="col" className="p-2 text-left border-r border-slate-300">Nazwa wskaźnika rezultatu / produktu</th>
              <th scope="col" className="p-2 text-center w-36">Status weryfikacji</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {application.monitoring_indicators.map((ind, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-300">{idx + 1}</td>
                <td className="p-2 text-slate-900">{ind}</td>
                <td className="p-2 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 print:text-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 print:text-black" aria-hidden="true" /> Zgodny z naborem
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* CZĘŚĆ VI: MATRYCA RYZYK I PLAN MITYGACJI */}
      <section className="mb-6 pdf-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-3 print:bg-slate-200 print:border-black">
          Część VI: Analiza Ryzyk i Procedury Zaradcze (Mitygacja)
        </h3>
        <table className="w-full text-xs border border-slate-300">
          <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 print:bg-slate-200">
            <tr>
              <th scope="col" className="p-2 text-center w-12 border-r border-slate-300">Lp.</th>
              <th scope="col" className="p-2 text-left w-1/2 border-r border-slate-300">Zidentyfikowane ryzyko</th>
              <th scope="col" className="p-2 text-left">Planowane działanie zaradcze / mitygujące</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {application.risk_assessment.map((r, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-300">{idx + 1}</td>
                <td className="p-2 font-medium text-rose-950 border-r border-slate-300 print:text-black">{r.risk}</td>
                <td className="p-2 text-slate-800">{r.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* CZĘŚĆ VII: OŚWIADCZENIA FORMALNO-PRAWNE WNIOSKODAWCY */}
      <section className="mb-6 pdf-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-3 print:bg-slate-200 print:border-black">
          Część VII: Oświadczenia Formalno-Prawne Wnioskodawcy
        </h3>
        <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-700 leading-normal">
          {application.declarations.map((dec, idx) => (
            <li key={idx} className="pl-1">{dec}</li>
          ))}
          <li className="pl-1">
            Oświadczam, że planowane działania są wolne od dyskryminacji ze względu na płeć, wiek, niepełnosprawność i pochodzenie, a tworzone prototypy spełniają wymogi dostępności określone w ustawie o zapewnianiu dostępności osobom ze szczególnymi potrzebami.
          </li>
          <li className="pl-1">
            Wyrażam zgodę na przetwarzanie danych osobowych przez Regionalny Ośrodek Polityki Społecznej w Krakowie do celów przeprowadzenia procedury naboru, oceny, monitoringu i audytu projektu grantowego (RODO).
          </li>
        </ol>
      </section>

      {/* CZĘŚĆ VIII: PODPISY, PIECZĘCIE I POTWIERDZENIE KANCELARYJNE */}
      <section className="pt-6 border-t-2 border-slate-900 official-signature-box pdf-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
          Część VIII: Podpisy Osób Upoważnionych i Potwierdzenie Złożenia
        </h3>
        
        <div className="grid grid-cols-2 gap-8 text-xs">
          {/* Pieczęć i podpis wnioskodawcy */}
          <div className="border border-slate-300 p-4 rounded bg-slate-50/50 print:bg-transparent">
            <div className="text-[11px] text-slate-500 mb-12">
              Miejscowość: ........................................, data: ........................
            </div>
            <div className="border-t-2 border-dashed border-slate-400 pt-2 text-center">
              <span className="font-bold text-slate-800 block">Czytelny podpis Wnioskodawcy</span>
              <span className="text-[10px] text-slate-500 block">(osoba reprezentująca podmiot lub lider grupy)</span>
            </div>
          </div>

          {/* Adnotacja kancelaryjna ROPS Kraków */}
          <div className="border border-slate-300 p-4 rounded bg-slate-50/50 print:bg-transparent">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wide mb-1">
              Potwierdzenie kancelarii ROPS w Krakowie
            </div>
            <p className="text-[10px] text-slate-500 mb-8">
              Wpłynęło do Wydziału Innowacji Społecznych i Dostępności
            </p>
            <div className="border-t-2 border-dashed border-slate-400 pt-2 text-center">
              <span className="font-bold text-slate-800 block">Pieczęć wpływu i podpis przyjmującego</span>
              <span className="text-[10px] text-slate-500 block">Regionalny Ośrodek Polityki Społecznej w Krakowie</span>
            </div>
          </div>
        </div>
      </section>

      {/* STOPKA DOKUMENTU A4 */}
      <footer className="mt-8 pt-4 border-t border-slate-300 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 print:text-slate-600">
        <div>
          Oficjalny wniosek aplikacyjny · Regionalny Ośrodek Polityki Społecznej w Krakowie · MHIS 2026
        </div>
        <div className="font-mono">
          Sygnatura: ROPS/IWS/{application.application_id}
        </div>
      </footer>
    </div>
  );
};
