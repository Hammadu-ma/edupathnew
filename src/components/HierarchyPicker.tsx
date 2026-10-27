import React from 'react';
import { Select } from './ui/Primitives';
import { useCatalog } from '../contexts/CatalogContext';

export interface HierarchyValue {
  university_id: string;
  program_id: string;
  study_year_id: string;
  term_id: string;
}
export const emptyHierarchy: HierarchyValue = { university_id: '', program_id: '', study_year_id: '', term_id: '' };

/** University → Program → Study year → Term. Year and term are only shown when the chosen parent has any. */
export function HierarchyPicker({ value, onChange }: { value: HierarchyValue; onChange: (v: HierarchyValue) => void }) {
  const { universities, programs, studyYears, terms } = useCatalog();
  const progs = programs.filter(p => p.university_id === value.university_id);
  const years = studyYears.filter(y => y.program_id === value.program_id);
  const termOpts = terms.filter(t => t.study_year_id === value.study_year_id);
  const opt = (label: string) => ({ value: '', label });

  return (
    <div className="space-y-4">
      <Select label="University" value={value.university_id}
        options={[opt('Select your university'), ...universities.map(u => ({ value: u.id, label: u.name }))]}
        onChange={v => onChange({ university_id: v, program_id: '', study_year_id: '', term_id: '' })} />
      <Select label="Program / Department" value={value.program_id}
        options={[opt(value.university_id ? 'Select your program' : 'Choose a university first'), ...progs.map(p => ({ value: p.id, label: p.name }))]}
        onChange={v => onChange({ ...value, program_id: v, study_year_id: '', term_id: '' })} />
      {years.length > 0 && (
        <Select label="Study year" value={value.study_year_id}
          options={[opt('Not specified'), ...years.map(y => ({ value: y.id, label: y.name }))]}
          onChange={v => onChange({ ...value, study_year_id: v, term_id: '' })} />
      )}
      {termOpts.length > 0 && (
        <Select label="Semester / course bundle (optional)" value={value.term_id}
          options={[opt('Not specified'), ...termOpts.map(t => ({ value: t.id, label: t.name }))]}
          onChange={v => onChange({ ...value, term_id: v })} />
      )}
    </div>
  );
}
