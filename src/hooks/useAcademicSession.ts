import { useState, useEffect } from 'react';
import {
  LS_ERP_YEAR,
  LS_ERP_SEM,
  SS_ACADEMIC_YEARS,
  SS_SEMESTERS,
} from '@/lib/constants';

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
    try {
      // H6: Note that although the values are initially seeded into sessionStorage by the login process,
      // we gracefully handle missing/corrupt data (H8).
      const yStr = sessionStorage.getItem(SS_ACADEMIC_YEARS);
      const sStr = sessionStorage.getItem(SS_SEMESTERS);

      let parsedYears: SemesterOption[] = [];
      let parsedSems: SemesterOption[] = [];

      if (yStr) {
        try {
          parsedYears = JSON.parse(yStr);
          setYears(parsedYears);
        } catch (e) {
          console.error('Failed to parse academic years', e);
        }
      }

      if (sStr) {
        try {
          parsedSems = JSON.parse(sStr);
          setSemesters(parsedSems);
        } catch (e) {
          console.error('Failed to parse semesters', e);
        }
      }

      // Restore from localStorage or pick the first available option
      const savedYear = localStorage.getItem(LS_ERP_YEAR);
      if (savedYear) {
        setSelectedYear(savedYear);
      } else if (parsedYears.length > 0) {
        setSelectedYear(parsedYears[0].value);
      }

      const savedSem = localStorage.getItem(LS_ERP_SEM);
      if (savedSem) {
        setSelectedSem(savedSem);
      } else if (parsedSems.length > 0) {
        setSelectedSem(parsedSems[0].value);
      }

      // Check if we completely lack session choices
      if (
        !yStr ||
        parsedYears.length === 0 ||
        !sStr ||
        parsedSems.length === 0
      ) {
        setSessionError('Academic sessions not found. Please login again.');
      }
    } catch (e) {
      console.error('Session init error:', e);
      setSessionError('Failed to initialize session data.');
    }
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
