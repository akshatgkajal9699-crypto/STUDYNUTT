import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface StudyData {
  grade: number;
  subject: string;
  dailyTargetMinutes: number;
  dailyTargetQuestions: number;
  todayQuestions: number;
  todayMinutes: number;
  correctAnswers: number;
  streakDays: number;
  lastStudyDate: string | null;
  activeDate: string;
  completedExams: number;
  bookmarks: string[];
  weakQuestions: string[];
}

interface StudyContextValue {
  data: StudyData;
  ready: boolean;
  setGrade: (grade: number) => void;
  setSubject: (subject: string) => void;
  setGoals: (minutes: number, questions: number) => void;
  recordQuestion: (questionId: string, isCorrect: boolean) => void;
  recordExam: (minutes: number) => void;
  toggleBookmark: (questionId: string) => void;
  removeWeakSpot: (questionId: string) => void;
}

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const TODAY = new Date().toLocaleDateString('en-CA');
const STORAGE_KEY = '@studynut/study-v1';
const THEME_KEY = '@studynut/theme-v1';
const DEFAULT_STUDY: StudyData = {
  grade: 9,
  subject: 'Mathematics',
  dailyTargetMinutes: 30,
  dailyTargetQuestions: 20,
  todayQuestions: 0,
  todayMinutes: 0,
  correctAnswers: 0,
  streakDays: 0,
  lastStudyDate: null,
  activeDate: TODAY,
  completedExams: 0,
  bookmarks: [],
  weakQuestions: [],
};

export const ThemePreferenceContext = createContext<ThemeContextValue | null>(
  null,
);
const StudyContext = createContext<StudyContextValue | null>(null);

function dateKey(date: Date) {
  return date.toLocaleDateString('en-CA');
}

function previousDateKey() {
  const previous = new Date();
  previous.setDate(previous.getDate() - 1);
  return dateKey(previous);
}

export function StudyProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<StudyData>(DEFAULT_STUDY);
  const [ready, setReady] = useState(false);
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const systemScheme = useColorScheme();

  useEffect(() => {
    let mounted = true;
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(THEME_KEY),
    ])
      .then(([storedStudy, storedMode]) => {
        if (!mounted) return;
        if (storedStudy) {
          const parsed = JSON.parse(storedStudy) as Partial<StudyData>;
          const restored = { ...DEFAULT_STUDY, ...parsed };
          if (restored.activeDate !== TODAY) {
            restored.todayQuestions = 0;
            restored.todayMinutes = 0;
            restored.correctAnswers = 0;
            restored.streakDays =
              restored.lastStudyDate === previousDateKey()
                ? restored.streakDays
                : 0;
            restored.activeDate = TODAY;
          }
          setData(restored);
        }
        if (storedMode === 'auto' || storedMode === 'light' || storedMode === 'dark') {
          setModeState(storedMode);
        }
      })
      .catch((error: unknown) => {
        console.warn('Could not restore STUDYNUT progress.', error);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(
      (error: unknown) => console.warn('Could not save STUDYNUT progress.', error),
    );
  }, [data, ready]);

  const setGrade = useCallback((grade: number) => {
    setData((current) => ({
      ...current,
      grade,
      subject: 'Mathematics',
    }));
  }, []);

  const setSubject = useCallback((subject: string) => {
    setData((current) => ({ ...current, subject }));
  }, []);

  const setGoals = useCallback((minutes: number, questions: number) => {
    setData((current) => ({
      ...current,
      dailyTargetMinutes: minutes,
      dailyTargetQuestions: questions,
    }));
  }, []);

  const recordQuestion = useCallback((questionId: string, isCorrect: boolean) => {
    const today = dateKey(new Date());
    setData((current) => {
      const streakDays =
        current.lastStudyDate === today
          ? current.streakDays
          : current.lastStudyDate === previousDateKey()
            ? current.streakDays + 1
            : 1;
      return {
        ...current,
        activeDate: today,
        lastStudyDate: today,
        streakDays,
        todayQuestions: current.activeDate === today ? current.todayQuestions + 1 : 1,
        todayMinutes: current.activeDate === today ? current.todayMinutes + 2 : 2,
        correctAnswers: current.activeDate === today
          ? current.correctAnswers + (isCorrect ? 1 : 0)
          : isCorrect ? 1 : 0,
        weakQuestions: isCorrect
          ? current.weakQuestions
          : Array.from(new Set([...current.weakQuestions, questionId])),
      };
    });
  }, []);

  const recordExam = useCallback((minutes: number) => {
    const today = dateKey(new Date());
    setData((current) => {
      const streakDays =
        current.lastStudyDate === today
          ? current.streakDays
          : current.lastStudyDate === previousDateKey()
            ? current.streakDays + 1
            : 1;
      const isNewDay = current.activeDate !== today;
      return {
        ...current,
        activeDate: today,
        lastStudyDate: today,
        streakDays,
        todayMinutes: (isNewDay ? 0 : current.todayMinutes) + Math.max(1, minutes),
        completedExams: current.completedExams + 1,
      };
    });
  }, []);

  const toggleBookmark = useCallback((questionId: string) => {
    setData((current) => ({
      ...current,
      bookmarks: current.bookmarks.includes(questionId)
        ? current.bookmarks.filter((id) => id !== questionId)
        : [...current.bookmarks, questionId],
    }));
  }, []);

  const removeWeakSpot = useCallback((questionId: string) => {
    setData((current) => ({
      ...current,
      weakQuestions: current.weakQuestions.filter((id) => id !== questionId),
    }));
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(THEME_KEY, nextMode).catch((error: unknown) =>
      console.warn('Could not save STUDYNUT theme preference.', error),
    );
  }, []);

  const studyValue = useMemo(
    () => ({
      data,
      ready,
      setGrade,
      setSubject,
      setGoals,
      recordQuestion,
      recordExam,
      toggleBookmark,
      removeWeakSpot,
    }),
    [
      data,
      ready,
      setGrade,
      setSubject,
      setGoals,
      recordQuestion,
      recordExam,
      toggleBookmark,
      removeWeakSpot,
    ],
  );
  const themeValue = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  const resolvedMode: 'light' | 'dark' =
    mode === 'auto' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  return (
    <ThemePreferenceContext.Provider value={themeValue}>
      <StudyContext.Provider value={studyValue}>
        <StudyPaletteContext.Provider value={resolvedMode}>
          {children}
        </StudyPaletteContext.Provider>
      </StudyContext.Provider>
    </ThemePreferenceContext.Provider>
  );
}

const StudyPaletteContext = createContext<'light' | 'dark'>('light');

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error('useStudy must be used within StudyProvider.');
  return context;
}

export function useThemeMode() {
  const context = useContext(ThemePreferenceContext);
  if (!context) throw new Error('useThemeMode must be used within StudyProvider.');
  return context;
}

export function usePalette() {
  const mode = useContext(StudyPaletteContext);
  return mode === 'dark' ? colors.dark : colors.light;
}