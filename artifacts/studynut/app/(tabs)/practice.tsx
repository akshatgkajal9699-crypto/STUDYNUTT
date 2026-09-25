import React, { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ActionButton, BodyText, Card, PageTitle, Screen, Tag, uiStyles } from '@/components/studynut-ui';
import { useStudy } from '@/context/StudyProvider';
import { questionsForSubject, subjectsForGrade } from '@/data/questions';
import { useColors } from '@/hooks/useColors';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'] as const;

export default function PracticeScreen() {
  const { data, recordQuestion, toggleBookmark, setSubject } = useStudy();
  const colors = useColors();
  const subjects = subjectsForGrade(data.grade);
  const subject = subjects.includes(data.subject) ? data.subject : 'Mathematics';
  const [difficulty, setDifficulty] = useState<string>('All');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const filtered = useMemo(
    () => questionsForSubject(subject, difficulty === 'All' ? undefined : difficulty),
    [subject, difficulty],
  );
  const question = filtered[index % Math.max(1, filtered.length)];
  const isBookmarked = question ? data.bookmarks.includes(question.id) : false;

  function updateSubject(next: string) {
    setSubject(next);
    setIndex(0);
    setSelected(null);
    setResult(null);
  }

  function updateDifficulty(next: string) {
    setDifficulty(next);
    setIndex(0);
    setSelected(null);
    setResult(null);
  }

  async function submitAnswer() {
    if (!question || selected === null || result !== null) return;
    const correct = selected === question.correctIndex;
    recordQuestion(question.id, correct);
    setResult(correct);
    await Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    );
  }

  function nextQuestion() {
    setIndex((current) => current + 1);
    setSelected(null);
    setResult(null);
  }

  return (
    <Screen>
      <PageTitle
        eyebrow={`Grade ${data.grade} · Stage ${data.grade + 1}`}
        title="Practice"
        subtitle="Build confidence one question at a time."
        right={<Tag tone="green">Sample set</Tag>}
      />

      <View style={{ gap: 9 }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.6 }}>SUBJECT</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {subjects.map((item) => {
            const active = item === subject;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`practice-subject-${item.toLowerCase().replaceAll(' ', '-')}`}
                onPress={() => updateSubject(item)}
                style={({ pressed }) => ({
                  minHeight: 38,
                  paddingHorizontal: 13,
                  justifyContent: 'center',
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : colors.card,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: active ? colors.primary : colors.mutedForeground, fontFamily: active ? 'Inter_600SemiBold' : 'Inter_500Medium', fontSize: 12 }}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 9 }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.6 }}>DIFFICULTY</Text>
        <View style={[uiStyles.row, { gap: 8, flexWrap: 'wrap' }]}>
          {DIFFICULTIES.map((item) => {
            const active = item === difficulty;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`difficulty-${item.toLowerCase()}`}
                onPress={() => updateDifficulty(item)}
                style={({ pressed }) => ({
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary : colors.card,
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {question ? (
        <Card style={{ padding: 18, gap: 15 }}>
          <View style={[uiStyles.between]}>
            <View style={[uiStyles.row, uiStyles.gap8]}>
              <Tag tone={question.difficulty === 'Hard' ? 'warning' : question.difficulty === 'Easy' ? 'green' : 'primary'}>
                {question.difficulty}
              </Tag>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>{question.chapter}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
              accessibilityState={{ selected: isBookmarked }}
              testID="practice-bookmark"
              onPress={() => toggleBookmark(question.id)}
              style={({ pressed }) => ({ padding: 5, opacity: pressed ? 0.6 : 1 })}
            >
              <Feather name={isBookmarked ? 'bookmark' : 'bookmark'} size={19} color={isBookmarked ? colors.primary : colors.mutedForeground} />
            </Pressable>
          </View>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 28, letterSpacing: -0.35 }}>
            {question.prompt}
          </Text>
          <View style={{ gap: 9 }}>
            {question.answers.map((answer, answerIndex) => {
              const isCorrectAnswer = result !== null && answerIndex === question.correctIndex;
              const isWrongSelected = result === false && answerIndex === selected;
              const isSelected = answerIndex === selected;
              const borderColor = isCorrectAnswer
                ? colors.emerald
                : isWrongSelected
                  ? colors.destructive
                  : isSelected
                    ? colors.primary
                    : colors.border;
              const backgroundColor = isCorrectAnswer
                ? colors.emeraldSoft
                : isWrongSelected
                  ? colors.destructive + '16'
                  : isSelected
                    ? colors.primarySoft
                    : colors.card;
              return (
                <Pressable
                  key={`${question.id}-${answerIndex}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected, disabled: result !== null }}
                  testID={`answer-${answerIndex}`}
                  disabled={result !== null}
                  onPress={() => setSelected(answerIndex)}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderWidth: 1,
                    borderColor,
                    borderRadius: 14,
                    paddingHorizontal: 13,
                    paddingVertical: 10,
                    backgroundColor,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 9,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isCorrectAnswer ? colors.emerald : isWrongSelected ? colors.destructive : colors.muted,
                  }}>
                    {isCorrectAnswer ? (
                      <Feather name="check" size={14} color="#FFFFFF" />
                    ) : isWrongSelected ? (
                      <Feather name="x" size={14} color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_700Bold', fontSize: 11 }}>{String.fromCharCode(65 + answerIndex)}</Text>
                    )}
                  </View>
                  <Text style={{ flex: 1, color: colors.foreground, fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular', fontSize: 14, lineHeight: 20 }}>{answer}</Text>
                </Pressable>
              );
            })}
          </View>
          {result !== null ? (
            <View style={{
              padding: 13,
              borderRadius: 15,
              backgroundColor: result ? colors.emeraldSoft : colors.warningSoft,
              gap: 5,
            }}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 13 }}>
                {result ? 'That’s right.' : 'Not quite — here’s why.'}
              </Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}>{question.explanation}</Text>
            </View>
          ) : null}
          {result === null ? (
            <ActionButton
              title="Check answer"
              icon="check-circle"
              onPress={submitAnswer}
              disabled={selected === null}
              testID="check-answer"
            />
          ) : (
            <ActionButton title="Next question" icon="arrow-right" onPress={nextQuestion} testID="next-question" />
          )}
        </Card>
      ) : (
        <Card style={{ gap: 10 }}>
          <Feather name="book-open" size={22} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 }}>More questions are being prepared</Text>
          <BodyText>This subject is part of your syllabus selector. Try Mathematics, Science, Physics, Chemistry, Biology or English in this sample set.</BodyText>
        </Card>
      )}

      <View style={[uiStyles.between, { paddingHorizontal: 3 }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>
          {filtered.length > 0 ? `Question ${(index % filtered.length) + 1} of ${filtered.length}` : 'No questions in this sample set'}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>Progress saves on this device</Text>
      </View>
    </Screen>
  );
}