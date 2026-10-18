import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ActionButton, BodyText, Card, PageTitle, ProgressBar, Screen, SectionHeading, Tag, uiStyles } from '@/components/studynut-ui';
import { StudyQuestion, WrittenPrompt, questionsForSubject, subjectsForGrade, WRITTEN_PROMPTS } from '@/data/questions';
import { useStudy } from '@/context/StudyProvider';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/revenuecat';

type ExamMode = 'mcq' | 'written';
interface ExamSession {
  mode: ExamMode;
  title: string;
  subject: string;
  durationMinutes: number;
  startedAt: number;
  endsAt: number;
  questionIndex: number;
  results: boolean[];
  selectedIndex: number | null;
  answerText: string;
  revealed: boolean;
  isTimed: boolean;
  mcqQuestions: StudyQuestion[];
  writtenQuestions: WrittenPrompt[];
}

interface ExamResult {
  title: string;
  subject: string;
  score: number;
  total: number;
  elapsedMinutes: number;
}

const CUSTOM_DURATIONS = [15, 30, 45];
const CUSTOM_DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const WRITTEN_QUESTIONS: Record<string, WrittenPrompt[]> = WRITTEN_PROMPTS;

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return [hours, minutes, remaining]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export default function ExamsScreen() {
  const { data, recordQuestion, recordExam, setSubject } = useStudy();
  const { isPro, showPaywall } = useSubscription();
  const colors = useColors();
  const router = useRouter();
  const subjects = subjectsForGrade(data.grade);
  const subject = subjects.includes(data.subject) ? data.subject : 'Mathematics';
  const [customSubject, setCustomSubject] = useState(subject);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [customDifficulty, setCustomDifficulty] = useState('All');
  const [session, setSession] = useState<ExamSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [openCommandTerm, setOpenCommandTerm] = useState<string | null>(null);
  const completionRef = useRef<(() => void) | null>(null);
  const mcqSource = useMemo(() => questionsForSubject(subject), [subject]);
  const currentMcq = session?.mcqQuestions[session.questionIndex];
  const currentWritten = session?.writtenQuestions[session.questionIndex];

  function finishExam(resultItems: boolean[]) {
    if (!session) return;
    const elapsedMinutes = Math.max(1, Math.floor((Date.now() - session.startedAt) / 60_000));
    const result = {
      title: session.title,
      subject: session.subject,
      score: resultItems.filter(Boolean).length,
      total: session.mode === 'mcq' ? session.mcqQuestions.length : session.writtenQuestions.length,
      elapsedMinutes,
    };
    recordExam(elapsedMinutes, result);
    setExamResult(result);
    setSession(null);
  }

  completionRef.current = () => finishExam(session?.results ?? []);

  useEffect(() => {
    if (!session) return;
    const tick = () => {
      if (!session.isTimed) return;
      const remaining = Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) completionRef.current?.();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session?.endsAt]);

  function startExam(kind: 'paper2' | 'paper4' | 'custom') {
    const isWritten = kind === 'paper4';
    if (kind !== 'custom' && !isPro) {
      showPaywall(kind === 'paper2' ? 'paper-2' : 'paper-4');
      return;
    }
    const isTimed = isPro || kind !== 'custom';
    const selectedSubject = kind === 'custom' ? customSubject : subject;
    const chosenSubject =
      isWritten && !WRITTEN_QUESTIONS[selectedSubject]
        ? 'Mathematics'
        : selectedSubject;
    const durationMinutes = kind === 'paper2' ? 45 : kind === 'paper4' ? 120 : customMinutes;
    const writtenSet =
      WRITTEN_QUESTIONS[chosenSubject] ??
      WRITTEN_QUESTIONS.Mathematics;
    const mcqQuestions = kind === 'custom'
      ? questionsForSubject(
          chosenSubject,
          customDifficulty === 'All' ? undefined : customDifficulty,
        )
      : questionsForSubject(chosenSubject);
    setExamResult(null);
    setSubject(chosenSubject);
    setSession({
      mode: isWritten ? 'written' : 'mcq',
      title:
        kind === 'paper2'
          ? 'Cambridge Paper 2 · MCQ'
          : kind === 'paper4'
            ? 'Cambridge Paper 4 · Extended'
            : 'Custom practice paper',
      subject: chosenSubject,
      durationMinutes,
      startedAt: Date.now(),
      endsAt: Date.now() + durationMinutes * 60_000,
      questionIndex: 0,
      results: [],
      selectedIndex: null,
      answerText: '',
      revealed: false,
      isTimed,
      mcqQuestions: mcqQuestions.slice(0, 5),
      writtenQuestions: writtenSet,
    });
  }

  function finishEarly() {
    if (session) finishExam(session.results);
  }

  function submitMcq() {
    if (!session || !currentMcq || session.selectedIndex === null) return;
    const isCorrect = session.selectedIndex === currentMcq.correctIndex;
    recordQuestion(currentMcq.id, isCorrect);
    const nextResults = [...session.results, isCorrect];
    if (session.questionIndex + 1 >= session.mcqQuestions.length) {
      finishExam(nextResults);
      return;
    }
    setSession({
      ...session,
      results: nextResults,
      questionIndex: session.questionIndex + 1,
      selectedIndex: null,
      answerText: '',
      revealed: false,
    });
  }

  function revealMarkingGuide() {
    if (!session || !currentWritten || !session.answerText.trim()) return;
    setSession({ ...session, revealed: true });
  }

  function selfMark(isCorrect: boolean) {
    if (!session) return;
    const nextResults = [...session.results, isCorrect];
    if (session.questionIndex + 1 >= session.writtenQuestions.length) {
      finishExam(nextResults);
      return;
    }
    setSession({
      ...session,
      results: nextResults,
      questionIndex: session.questionIndex + 1,
      answerText: '',
      revealed: false,
    });
  }

  if (session) {
    const total = session.mode === 'mcq' ? session.mcqQuestions.length : session.writtenQuestions.length;
    const prompt = session.mode === 'mcq' ? currentMcq?.prompt : currentWritten?.prompt;
    return (
      <Screen contentStyle={{ flex: 1 }}>
        <View style={[uiStyles.between, { gap: 12 }]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text numberOfLines={1} style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 }}>{session.title}</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>{session.subject} · Question {session.questionIndex + 1} of {total}</Text>
          </View>
          <View style={[uiStyles.row, uiStyles.gap8, {
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 14,
             backgroundColor: session.isTimed && secondsLeft < 300 ? colors.warningSoft : colors.primarySoft,
          }]}>
             <Feather name={session.isTimed ? 'clock' : 'coffee'} size={15} color={session.isTimed && secondsLeft < 300 ? colors.warning : colors.primary} />
             <Text accessibilityLiveRegion="polite" style={{ color: session.isTimed && secondsLeft < 300 ? colors.warning : colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13, fontVariant: ['tabular-nums'] }}>
               {session.isTimed ? formatTime(secondsLeft) : 'Untimed'}
            </Text>
          </View>
        </View>
        <ProgressBar progress={(session.questionIndex + 1) / total} />
        <Card style={{ flex: 1, justifyContent: 'center' }}>
          <Tag tone={session.mode === 'written' ? 'warning' : 'primary'}>
            {session.mode === 'written' ? 'Extended response' : currentMcq?.difficulty ?? 'Question'}
          </Tag>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 21, lineHeight: 30 }}>{prompt}</Text>
          {session.mode === 'mcq' && currentMcq ? (
            <View style={{ gap: 9, marginTop: 4 }}>
              {currentMcq.answers.map((answer, index) => {
                const selected = session.selectedIndex === index;
                return (
                  <Pressable
                    key={`${currentMcq.id}-${index}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    testID={`exam-answer-${index}`}
                    onPress={() => setSession({ ...session, selectedIndex: index })}
                    style={({ pressed }) => ({
                      minHeight: 50,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primarySoft : colors.card,
                      paddingHorizontal: 13,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 11,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ color: selected ? colors.primary : colors.mutedForeground, fontFamily: 'Inter_700Bold', fontSize: 12 }}>{String.fromCharCode(65 + index)}</Text>
                    <Text style={{ color: colors.foreground, fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular', fontSize: 14 }}>{answer}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : session.mode === 'written' && currentWritten ? (
            <View style={{ gap: 12, marginTop: 4 }}>
              <TextInput
                accessibilityLabel="Write your exam response"
                testID="exam-written-answer"
                multiline
                value={session.answerText}
                onChangeText={(answerText) => setSession({ ...session, answerText })}
                placeholder="Show your working or explain your reasoning…"
                placeholderTextColor={colors.mutedForeground}
                textAlignVertical="top"
                style={{
                  minHeight: 120,
                  maxHeight: 240,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 15,
                  padding: 13,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  lineHeight: 21,
                }}
              />
              {session.revealed ? (
                <View style={{ padding: 14, borderRadius: 15, backgroundColor: colors.emeraldSoft, gap: 5 }}>
                  <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 13 }}>Marking guide</Text>
                  <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}>{currentWritten.markingGuide}</Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }}>Review your work against this sample guide. It is not an official mark scheme.</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Card>
        {session.mode === 'mcq' ? (
          <ActionButton
            title={session.questionIndex + 1 === total ? 'Submit paper' : 'Lock answer & continue'}
            icon="arrow-right"
            onPress={submitMcq}
            disabled={session.selectedIndex === null}
            testID="exam-submit-answer"
          />
        ) : session.revealed ? (
          <View style={[uiStyles.row, uiStyles.gap8]}>
            <View style={{ flex: 1 }}>
              <ActionButton title="Needs review" variant="secondary" onPress={() => selfMark(false)} testID="exam-self-mark-no" />
            </View>
            <View style={{ flex: 1 }}>
              <ActionButton title="I got it" icon="check" onPress={() => selfMark(true)} testID="exam-self-mark-yes" />
            </View>
          </View>
        ) : (
          <ActionButton title="Show marking guide" icon="eye" onPress={revealMarkingGuide} disabled={!session.answerText.trim()} testID="exam-marking-guide" />
        )}
        <ActionButton title="Finish paper early" variant="quiet" onPress={finishEarly} testID="exam-finish-early" />
      </Screen>
    );
  }

  return (
    <Screen>
       <PageTitle eyebrow={`Grade ${data.grade} · Exam prep`} title="Exam simulator" subtitle="Build confidence with untimed practice or unlock the full timer with PRO." />
      <Card style={{ gap: 12, backgroundColor: colors.surfaceRaised }}>
        <View style={[uiStyles.row, uiStyles.gap12]}>
          <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="layers" size={19} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 }}>Exam tools</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>Scan your working or practise a spoken answer with the examiner preview.</Text>
          </View>
        </View>
        <View style={[uiStyles.row, uiStyles.gap8]}>
          <View style={{ flex: 1 }}>
            <ActionButton title="Scan paper" icon="camera" variant="secondary" onPress={() => router.push('/scan')} testID="open-paper-scan" />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton title="Ghost Mode" icon="mic" onPress={() => router.push('/ghost')} testID="open-ghost-mode" />
          </View>
        </View>
      </Card>
      {examResult ? (
        <Card style={{ backgroundColor: colors.emeraldSoft, borderColor: colors.emeraldSoft }}>
          <View style={[uiStyles.row, uiStyles.gap12]}>
            <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="award" size={20} color={colors.emerald} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Paper complete</Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>{examResult.title} · {examResult.elapsedMinutes} min</Text>
            </View>
          </View>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 24 }}>{examResult.score} / {examResult.total}<Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 13 }}>  self-marked</Text></Text>
          <BodyText>Your result and study time are saved to your study history.</BodyText>
        </Card>
      ) : null}

      <SectionHeading title="Cambridge practice formats" />
      <Card style={{ gap: 13 }}>
        <View style={[uiStyles.row, uiStyles.gap12]}>
          <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="check-square" size={19} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 }}>Paper 2 · Multiple choice</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>45 minutes · timed sample set</Text>
          </View>
          <Tag>45 min</Tag>
        </View>
         <ActionButton title={isPro ? 'Start Paper 2' : 'Unlock with PRO'} icon={isPro ? 'play' : 'lock'} onPress={() => startExam('paper2')} testID="start-paper-2" />
      </Card>

      <Card style={{ gap: 13 }}>
        <View style={[uiStyles.row, uiStyles.gap12]}>
          <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="edit-3" size={18} color={colors.emerald} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 }}>Paper 4 · Extended</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>2 hours · write, reveal and self-mark</Text>
          </View>
          <Tag tone="green">2 hours</Tag>
        </View>
         <ActionButton title={isPro ? 'Start Paper 4' : 'Unlock with PRO'} icon={isPro ? 'play' : 'lock'} variant="secondary" onPress={() => startExam('paper4')} testID="start-paper-4" />
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }}>Sample prompts and marking guides are for practice only, not official Cambridge papers.</Text>
      </Card>

      <View style={{ gap: 11 }}>
        <SectionHeading title="Command term radar" action={isPro ? 'Interactive' : 'Basic definitions'} />
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>
          Use the command term to decide what a complete answer needs. PRO members can open the contextual rubric card.
        </Text>
        <View style={{ gap: 8 }}>
          {[
            { term: 'State', definition: 'Give a concise fact or answer.', rubric: 'Do not add a long explanation unless the question asks for one.' },
            { term: 'Describe', definition: 'Give a detailed account of what happens.', rubric: 'Include the key features in a logical order; avoid unsupported reasons.' },
            { term: 'Explain', definition: 'Give reasons or show how something happens.', rubric: 'Link cause and effect with because, so, or therefore.' },
            { term: 'Evaluate', definition: 'Make a supported judgement.', rubric: 'Balance evidence, explain why it matters, and reach a clear conclusion.' },
          ].map((item) => {
            const expanded = openCommandTerm === item.term && isPro;
            return (
              <Pressable
                key={item.term}
                accessibilityRole="button"
                testID={`command-term-${item.term.toLowerCase()}`}
                onPress={() => {
                  if (!isPro) {
                    showPaywall('command-term');
                  } else {
                    setOpenCommandTerm(expanded ? null : item.term);
                  }
                }}
                style={({ pressed }) => ({
                  padding: 13,
                  borderRadius: 15,
                  borderWidth: 1,
                  borderColor: expanded ? colors.primary : colors.border,
                  backgroundColor: expanded ? colors.primarySoft : colors.card,
                  opacity: pressed ? 0.76 : 1,
                  gap: 7,
                })}
              >
                <View style={[uiStyles.between, { gap: 10 }]}>
                  <View style={[uiStyles.row, uiStyles.gap8]}>
                    <Tag tone="warning">{item.term}</Tag>
                    {!isPro ? <Feather name="lock" size={13} color={colors.mutedForeground} /> : null}
                  </View>
                  <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
                </View>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 }}>{item.definition}</Text>
                {expanded ? (
                  <View style={{ padding: 10, borderRadius: 12, backgroundColor: colors.card, gap: 3 }}>
                    <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.5 }}>RUBRIC CARD</Text>
                    <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>{item.rubric}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Build a custom set" />
        <Card>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>SUBJECT</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {subjects.slice(0, 6).map((item) => {
                const active = item === customSubject;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    testID={`custom-subject-${item.toLowerCase().replaceAll(' ', '-')}`}
                    onPress={() => setCustomSubject(item)}
                    style={({ pressed }) => ({
                      borderRadius: 99,
                      paddingHorizontal: 11,
                      paddingVertical: 8,
                      backgroundColor: active ? colors.primarySoft : colors.muted,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Text style={{ color: active ? colors.primary : colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>TIME LIMIT</Text>
            <View style={[uiStyles.row, uiStyles.gap8]}>
              {CUSTOM_DURATIONS.map((minutes) => (
                <Pressable
                  key={minutes}
                  accessibilityRole="button"
                  accessibilityState={{ selected: customMinutes === minutes }}
                  onPress={() => setCustomMinutes(minutes)}
                  style={({ pressed }) => ({
                    borderRadius: 12,
                    paddingVertical: 9,
                    paddingHorizontal: 13,
                    backgroundColor: customMinutes === minutes ? colors.primary : colors.muted,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text style={{ color: customMinutes === minutes ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{minutes} min</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>DIFFICULTY MIX</Text>
            <View style={[uiStyles.row, uiStyles.gap8, { flexWrap: 'wrap' }]}>
              {CUSTOM_DIFFICULTIES.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: customDifficulty === item }}
                  onPress={() => setCustomDifficulty(item)}
                  style={({ pressed }) => ({
                    borderRadius: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 11,
                    backgroundColor: customDifficulty === item ? colors.primary : colors.muted,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text style={{ color: customDifficulty === item ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
           <ActionButton title="Create untimed custom paper" icon="sliders" onPress={() => startExam('custom')} testID="start-custom-exam" />
        </Card>
      </View>
      <View style={[uiStyles.row, uiStyles.gap8, { paddingHorizontal: 2 }]}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={{ flex: 1, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }}>Practice content is locally bundled sample material. Official past papers and mark schemes are not connected.</Text>
      </View>
    </Screen>
  );
}