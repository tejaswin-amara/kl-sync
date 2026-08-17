import { useState, useEffect } from 'react';

const LS_ERP_YEAR = 'kl_erp_year';
const LS_ERP_SEM = 'kl_erp_sem';
const LS_ACADEMIC_YEARS = 'kl_erp_academic_years';
const LS_SEMESTERS = 'kl_erp_semesters';
const SS_ACADEMIC_YEARS = 'kl_erp_academic_years';
const SS_SEMESTERS = 'kl_erp_semesters';

export interface SemesterOption {
  value: string;
  label: string;
}

export function useAcademicSession() {
  const [years, setYears] = useState<SemesterOption[]>([]);
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const yStr =
          localStorage.getItem(LS_ACADEMIC_YEARS) ||
          localStorage.getItem(SS_ACADEMIC_YEARS) ||
          sessionStorage.getItem(SS_ACADEMIC_YEARS);
        const sStr =
          localStorage.getItem(LS_SEMESTERS) ||
          localStorage.getItem(SS_SEMESTERS) ||
          sessionStorage.getItem(SS_SEMESTERS);

        let parsedYears: SemesterOption[] = [];
        let parsedSems: SemesterOption[] = [];
        let initialError: string | null = null;

        if (yStr) {
          try {
            parsedYears = JSON.parse(yStr);
          } catch (e) {
            console.error('Failed to parse academic years', e);
          }
        }

        if (sStr) {
          try {
            parsedSems = JSON.parse(sStr);
          } catch (e) {
            console.error('Failed to parse semesters', e);
          }
        }

        // Restore from localStorage or pick the first available option
        const savedYear = localStorage.getItem(LS_ERP_YEAR);
        const targetYear =
          savedYear || (parsedYears.length > 0 ? parsedYears[0].value : '');

        const savedSem = localStorage.getItem(LS_ERP_SEM);
        const targetSem =
          savedSem || (parsedSems.length > 0 ? parsedSems[0].value : '');

        // Check if we completely lack session choices
        if (
          !yStr ||
          parsedYears.length === 0 ||
          !sStr ||
          parsedSems.length === 0
        ) {
          initialError = 'Academic sessions not found. Please login again.';
        }

        setYears(parsedYears);
        setSemesters(parsedSems);
        if (targetYear) setSelectedYear(targetYear);
        if (targetSem) setSelectedSem(targetSem);
        if (initialError) setSessionError(initialError);
      } catch (e) {
        console.error('Session init error:', e);
        setSessionError('Failed to initialize session data.');
      }
    });
  }, []);

  const handleYearChange = (val: string) => {
    setSelectedYear(val);
    localStorage.setItem(LS_ERP_YEAR, val);
  };

  const handleSemChange = (val: string) => {
    setSelectedSem(val);
    localStorage.setItem(LS_ERP_SEM, val);
  };

  return {
    years,
    semesters,
    selectedYear,
    selectedSem,
    handleYearChange,
    handleSemChange,
    sessionError,
  };
}
