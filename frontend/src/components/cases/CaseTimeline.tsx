import React from 'react';
import { AlertTriangle, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { TimelineStep } from '../../types';
import { formatDateTime } from '../../constants/domain';

interface CaseTimelineProps {
  steps: TimelineStep[];
  label?: string;
  compact?: boolean;
}

const toneIcon = (step: TimelineStep) => {
  if (!step.done) return <Circle className="w-5 h-5 text-slate-500" aria-hidden="true" />;
  if (step.tone === 'negative') return <XCircle className="w-5 h-5 text-rose-700" aria-hidden="true" />;
  if (step.tone === 'warning') return <AlertTriangle className="w-5 h-5 text-orange-700" aria-hidden="true" />;
  return <CheckCircle2 className="w-5 h-5 text-emerald-700" aria-hidden="true" />;
};

const stateText = (step: TimelineStep) => (step.done ? 'zrobione' : step.current ? 'teraz' : 'jeszcze nie');

/** Pionowa oś czasu sprawy: kroki z datami, bieżący krok wyróżniony (aria-current="step"). */
export const CaseTimeline: React.FC<CaseTimelineProps> = ({ steps, label = 'Przebieg sprawy', compact = false }) => (
  <ol aria-label={label} className="relative">
    {steps.map((step, i) => {
      const last = i === steps.length - 1;
      return (
        <li key={step.key} aria-current={step.current ? 'step' : undefined} className="relative flex gap-3 pb-5 last:pb-0">
          {!last && (
            <span
              className={`absolute left-[9px] top-6 bottom-0 w-0.5 ${step.done ? 'bg-emerald-600' : 'bg-slate-300'}`}
              aria-hidden="true"
            />
          )}
          <span className="relative z-10 bg-white shrink-0">{toneIcon(step)}</span>
          <div className={`min-w-0 flex-1 ${step.current && !step.done ? 'bg-amber-50 border-l-4 border-amber-400 -mt-1 px-3 py-2 rounded-r-lg' : ''}`}>
            <p className="font-bold text-slate-900 leading-tight">
              {step.label}
              <span className="sr-only"> ({stateText(step)})</span>
              {step.current && !step.done && (
                <span className="ml-2 text-xs font-bold text-slate-900 bg-amber-300 px-1.5 py-0.5 rounded" aria-hidden="true">
                  Teraz
                </span>
              )}
            </p>
            {step.date && (
              <p className="text-sm text-slate-600">
                <time dateTime={step.date}>{formatDateTime(step.date)}</time>
              </p>
            )}
            {!compact && <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-line">{step.description}</p>}
          </div>
        </li>
      );
    })}
  </ol>
);
