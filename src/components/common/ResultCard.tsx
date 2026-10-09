import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';

/**
 * Shared sectioned result card for the tool tabs (Oracle, Concepts, ...).
 * Purely presentational: renders the same markdown text it is given, with
 * Amiri section headings and a gentle staggered fade-in of each section.
 */
export const ResultCard: React.FC<{
  text: string;
  /** Small caption above the text (e.g. "الجواب"). */
  label?: string;
  className?: string;
  id?: string;
}> = ({ text, label, className, id }) => (
  <section id={id} className={cn('tbn-result', className)}>
    {label && <div className="tbn-result__label">{label}</div>}
    <div className="tbn-result__body">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  </section>
);
