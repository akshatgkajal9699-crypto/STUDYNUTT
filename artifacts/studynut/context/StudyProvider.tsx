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
import { getGetStudyActivitiesQueryKey, useCreateStudyActivity, useGetStudyData, useSaveStudyData } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import colors from '@/constants/colors';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface StudyTutorMessage {
  id: string;
  role: 'student' | 'tutor';
  text: string;
}

export interface StudyExamResult {
  id: string;
  title: string;
  subject: string;
  score: number;
  total: number;
  elapsedMinutes: number;
  completedAt: string;
}

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
  examHistory: StudyExamResult[];
  tutorMessages: StudyTutorMessage[];
}

interface StudyContextValue {
  data: StudyData;
  ready: boolean;
  syncStatus: 'local' | 'syncing' | 'synced' | 'offline';
  setGrade: (grade: number) => void;
  setSubject: (subject: string) => void;
  setGoals: (minutes: number, questions: number) => void;
  recordQuestion: (questionId: string, isCorrect: boolean) => void;
  recordExam: (
    minutes: number,
    result?: Omit<StudyExamResult, 'id' | 'completedAt'>,
  ) => void;
  toggleBookmark: (questionId: string) => void;
  removeWeakSpot: (questionId: string) => void;
  setTutorMessages: (messages: StudyTutorMessage[]) => void;
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
  examHistory: [],
  tutorMessages: [],
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

export function StudyProvider({
  children,
  storageScope = 'guest',
  remoteEnabled = false,
}: PropsWithChildren<{ storageScope?: string; remoteEnabled?: boolean }>) {
  const [data, setData] = useState<StudyData>(DEFAULT_STUDY);
  const [ready, setReady] = useState(false);
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [cloudScope, setCloudScope] = useState<string | null>(null);
  const systemScheme = useColorScheme();
  const queryClient = useQueryClient();
  const cloudQuery = useGetStudyData({
    query: {
      enabled: remoteEnabled && ready && cloudScope !== storageScope,
      retry: 2,
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  });
  const { mutate: saveCloudData, isPending: isSavingCloud, isError: cloudSaveFailed } =
    useSaveStudyData();
  const { mutate: createStudyActivity } = useCreateStudyActivity();
  const scopedStorageKey = `${STORAGE_KEY}:${encodeURIComponent(storageScope)}`;

  useEffect(() => {
    let mounted = true;
    Promise.all([
      AsyncStorage.getItem(scopedStorageKey),
      storageScope === 'guest' ? AsyncStorage.getItem(STORAGE_KEY) : Promise.resolve(null),
      AsyncStorage.getItem(THEME_KEY),
    ])
      .then(([scopedStudy, legacyStudy, storedMode]) => {
        if (!mounted) return;
        const storedStudy = scopedStudy ?? (storageScope === 'guest' ? legacyStudy : null);
        if (storedStudy) {
          const parsed = JSON.parse(storedStudy) as Partial<StudyData>;
          const restored = { ...DEFAULT_STUDY, ...parsed };
          restored.examHistory = Array.isArray(parsed.examHistory)
            ? parsed.examHistory.filter(
                (item): item is StudyExamResult =>
                  typeof item === 'object' &&
                  item !== null &&
                  typeof item.id === 'string' &&
                  typeof item.title === 'string' &&
                  typeof item.subject === 'string' &&
                  typeof item.score === 'number' &&
                  typeof item.total === 'number' &&
                  typeof item.elapsedMinutes === 'number' &&
                  typeof item.completedAt === 'string',
              )
            : [];
          restored.tutorMessages = Array.isArray(parsed.tutorMessages)
            ? parsed.tutorMessages.filter(
                (item): item is StudyTutorMessage =>
                  typeof item === 'object' &&
                  item !== null &&
                  typeof item.id === 'string' &&
                  (item.role === 'student' || item.role === 'tutor') &&
                  typeof item.text === 'string',
              )
            : [];
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
  }, [scopedStorageKey, storageScope]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(scopedStorageKey, JSON.stringify(data)).catch(
      (error: unknown) => console.warn('Could not save STUDYNUT progress.', error),
    );
  }, [data, ready, scopedStorageKey]);

  useEffect(() => {
    if (!remoteEnabled || !ready || cloudScope === storageScope) return;
    if (cloudQuery.isSuccess) {
      const remoteData = cloudQuery.data.data;
      if (remoteData) {
        const restored = {
          ...DEFAULT_STUDY,
          ...remoteData,
          examHistory: Array.isArray(remoteData.examHistory)
            ? remoteData.examHistory
            : [],
          tutorMessages: Array.isArray(remoteData.tutorMessages)
            ? remoteData.tutorMessages
            : [],
        };
        setData(restored);
        void AsyncStorage.setItem(scopedStorageKey, JSON.stringify(restored)).catch(
          (error: unknown) => console.warn('Could not cache synced STUDYNUT progress.', error),
        );
      } else {
        saveCloudData({ data: { data } });
      }
      setCloudScope(storageScope);
    }
  }, [
    cloudQuery.data,
    cloudQuery.isSuccess,
    cloudScope,
    data,
    ready,
    remoteEnabled,
    saveCloudData,
    scopedStorageKey,
    storageScope,
  ]);

  useEffect(() => {
    if (!remoteEnabled || !ready || cloudScope !== storageScope) return;
    const timeout = setTimeout(() => {
      saveCloudData({ data: { data } });
    }, 900);
    return () => clearTimeout(timeout);
  }, [cloudScope, data, ready, remoteEnabled, saveCloudData, storageScope]);

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

  const recordExam = useCallback((
    minutes: number,
    result?: Omit<StudyExamResult, 'id' | 'completedAt'>,
  ) => {
    const today = dateKey(new Date());
    const completedAt = new Date().toISOString();
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
        examHistory: result
          ? [
              {
                ...result,
                id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                completedAt,
              },
              ...current.examHistory,
            ].slice(0, 100)
          : current.examHistory,
      };
    });
    if (remoteEnabled && result) {
      createStudyActivity(
        {
          data: {
            kind: 'exam-result',
            subject: result.subject,
            title: result.title,
            details: { ...result, completedAt },
          },
        },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: getGetStudyActivitiesQueryKey({ limit: 20 }),
            });
          },
        },
      );
    }
  }, [createStudyActivity, queryClient, remoteEnabled]);

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

  const setTutorMessages = useCallback((messages: StudyTutorMessage[]) => {
    setData((current) => {
      const nextMessages = messages.slice(-100);
      const unchanged =
        current.tutorMessages.length === nextMessages.length &&
        current.tutorMessages.every(
          (message, index) =>
            message.id === nextMessages[index]?.id &&
            message.role === nextMessages[index]?.role &&
            message.text === nextMessages[index]?.text,
        );
      return unchanged ? current : { ...current, tutorMessages: nextMessages };
    });
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
      syncStatus: !remoteEnabled
        ? 'local' as const
        : cloudQuery.isError || cloudSaveFailed
          ? 'offline' as const
          : cloudQuery.isFetching || isSavingCloud || cloudScope !== storageScope
            ? 'syncing' as const
            : 'synced' as const,
      setGrade,
      setSubject,
      setGoals,
      recordQuestion,
      recordExam,
      toggleBookmark,
      removeWeakSpot,
      setTutorMessages,
    }),
    [
      data,
      ready,
      remoteEnabled,
      cloudQuery.isError,
      cloudQuery.isFetching,
      cloudSaveFailed,
      cloudScope,
      storageScope,
      isSavingCloud,
      setGrade,
      setSubject,
      setGoals,
      recordQuestion,
      recordExam,
      toggleBookmark,
      removeWeakSpot,
      setTutorMessages,
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