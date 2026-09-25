import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { BodyText, Card, PageTitle, ProgressBar, Screen, SectionHeading, Tag, uiStyles } from '@/components/studynut-ui';
import { useStudy, useThemeMode } from '@/context/StudyProvider';
import { findQuestion, subjectsForGrade } from '@/data/questions';
import { useColors } from '@/hooks/useColors';

const GRADES = [6, 7, 8, 9, 10];
const STUDY_GOALS = [15, 30, 45, 60];
const QUESTION_GOALS = [10, 20, 30];

export default function ProfileScreen() {
  const { data, setGrade, setGoals, toggleBookmark, removeWeakSpot } = useStudy();
  const { mode, setMode } = useThemeMode();
  const colors = useColors();
  const subjects = subjectsForGrade(data.grade);
  const questionProgress = Math.min(1, data.todayQuestions / Math.max(1, data.dailyTargetQuestions));

  return (
    <Screen>
      <PageTitle eyebrow="YOUR STUDY SPACE" title="Profile & progress" subtitle="A few settings to make STUDYNUT fit your year." right={<Tag tone="green">On this device</Tag>} />

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{
          width: 54,
          height: 54,
          borderRadius: 19,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Feather name="user" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 17 }}>Your learning profile</Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>Grade {data.grade} · Stage {data.grade + 1} · {data.grade <= 8 ? 'Lower Secondary / MYP' : 'IGCSE / MYP'}</Text>
        </View>
      </Card>

      <View style={{ gap: 11 }}>
        <SectionHeading title="Choose your grade" />
        <Card>
          <View style={[uiStyles.row, { flexWrap: 'wrap', gap: 8 }]}>
            {GRADES.map((grade) => {
              const active = grade === data.grade;
              return (
                <Pressable
                  key={grade}
                  accessibilityRole="button"
                  accessibilityLabel={`Grade ${grade}`}
                  accessibilityState={{ selected: active }}
                  testID={`grade-${grade}`}
                  onPress={() => setGrade(grade)}
                  style={({ pressed }) => ({
                    width: 48,
                    height: 46,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? colors.primary : colors.muted,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_700Bold', fontSize: 14 }}>{grade}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ paddingTop: 3, gap: 5 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
              {data.grade <= 8 ? 'Lower Secondary · Stage ' + (data.grade + 1) : 'IGCSE / MYP · Stage ' + (data.grade + 1)}
            </Text>
            <BodyText style={{ fontSize: 12 }}>
              {data.grade <= 8
                ? 'Integrated Science stays combined at this stage.'
                : 'Science subjects are split into Physics, Chemistry and Biology.'}
            </BodyText>
          </View>
        </Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {subjects.map((subject) => (
            <Tag key={subject} tone={subject === data.subject ? 'primary' : 'neutral'}>{subject}</Tag>
          ))}
        </View>
      </View>

      <View style={{ gap: 11 }}>
        <SectionHeading title="Your daily goals" />
        <Card>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>STUDY MINUTES</Text>
            <View style={[uiStyles.row, uiStyles.gap8, { flexWrap: 'wrap' }]}>
              {STUDY_GOALS.map((minutes) => {
                const active = data.dailyTargetMinutes === minutes;
                return (
                  <Pressable
                    key={minutes}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    testID={`goal-minutes-${minutes}`}
                    onPress={() => setGoals(minutes, data.dailyTargetQuestions)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      borderRadius: 12,
                      backgroundColor: active ? colors.primary : colors.muted,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Text style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{minutes} min</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={{ gap: 8, marginTop: 3 }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>QUESTIONS PER DAY</Text>
            <View style={[uiStyles.row, uiStyles.gap8]}>
              {QUESTION_GOALS.map((count) => {
                const active = data.dailyTargetQuestions === count;
                return (
                  <Pressable
                    key={count}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    testID={`goal-questions-${count}`}
                    onPress={() => setGoals(data.dailyTargetMinutes, count)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 12,
                      backgroundColor: active ? colors.primary : colors.muted,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Text style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{count}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>
      </View>

      <View style={{ gap: 11 }}>
        <SectionHeading title="Today's progress" />
        <Card>
          <View style={[uiStyles.between]}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Questions answered</Text>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 }}>{data.todayQuestions} / {data.dailyTargetQuestions}</Text>
          </View>
          <ProgressBar progress={questionProgress} color={colors.emerald} />
          <View style={[uiStyles.row, { gap: 22, flexWrap: 'wrap' }]}>
            <View style={{ gap: 3 }}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 11 }}>STUDY TIME</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 17 }}>{data.todayMinutes} min</Text>
            </View>
            <View style={{ gap: 3 }}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 11 }}>CORRECT</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 17 }}>{data.correctAnswers}</Text>
            </View>
            <View style={{ gap: 3 }}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 11 }}>PAPERS</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 17 }}>{data.completedExams}</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={{ gap: 11 }}>
        <SectionHeading title="Display" />
        <Card>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Colour theme</Text>
          <View style={[uiStyles.row, uiStyles.gap8, { flexWrap: 'wrap' }]}>
            {(['auto', 'light', 'dark'] as const).map((item) => {
              const active = item === mode;
              const icon = item === 'auto' ? 'smartphone' : item === 'light' ? 'sun' : 'moon';
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  testID={`theme-${item}`}
                  onPress={() => setMode(item)}
                  style={({ pressed }) => ({
                    minWidth: 90,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: active ? colors.primarySoft : colors.muted,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Feather name={icon} size={14} color={active ? colors.primary : colors.mutedForeground} />
                  <Text style={{ color: active ? colors.primary : colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{item === 'auto' ? 'System' : item[0].toUpperCase() + item.slice(1)}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </View>

      <View style={{ gap: 11 }}>
        <SectionHeading title="Weak spots" action={`${data.weakQuestions.length} to review`} />
        {data.weakQuestions.length === 0 ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <Feather name="check-circle" size={19} color={colors.emerald} />
            <BodyText style={{ flex: 1, fontSize: 12 }}>When you miss a practice question, it will be saved here automatically.</BodyText>
          </Card>
        ) : (
          data.weakQuestions.map((id) => {
            const question = findQuestion(id);
            if (!question) return null;
            return (
              <Card key={id} style={{ gap: 9 }}>
                <View style={[uiStyles.between, { gap: 10 }]}>
                  <Tag tone="warning">{question.subject}</Tag>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove from weak spots"
                    testID={`remove-weak-${id}`}
                    onPress={() => removeWeakSpot(id)}
                    style={({ pressed }) => ({ padding: 5, opacity: pressed ? 0.6 : 1 })}
                  >
                    <Feather name="x" size={17} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 19 }}>{question.prompt}</Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>{question.chapter} · {question.difficulty}</Text>
              </Card>
            );
          })
        )}
      </View>

      <View style={{ gap: 11 }}>
        <SectionHeading title="Saved questions" action={`${data.bookmarks.length} saved`} />
        {data.bookmarks.length === 0 ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <Feather name="bookmark" size={18} color={colors.primary} />
            <BodyText style={{ flex: 1, fontSize: 12 }}>Bookmark questions in Practice to keep them close for revision.</BodyText>
          </Card>
        ) : (
          data.bookmarks.map((id) => {
            const question = findQuestion(id);
            if (!question) return null;
            return (
              <Card key={id} style={{ gap: 9 }}>
                <View style={[uiStyles.between, { gap: 10 }]}>
                  <Tag>{question.subject}</Tag>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove saved question"
                    testID={`remove-bookmark-${id}`}
                    onPress={() => toggleBookmark(id)}
                    style={({ pressed }) => ({ padding: 5, opacity: pressed ? 0.6 : 1 })}
                  >
                    <Feather name="bookmark" size={17} color={colors.primary} />
                  </Pressable>
                </View>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 19 }}>{question.prompt}</Text>
                <BodyText style={{ fontSize: 12 }}>{question.chapter}</BodyText>
              </Card>
            );
          })
        )}
      </View>

      <Card style={{ gap: 9 }}>
        <View style={[uiStyles.row, uiStyles.gap8]}>
          <Feather name="wifi-off" size={16} color={colors.emerald} />
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Offline-ready preview</Text>
        </View>
        <BodyText style={{ fontSize: 12 }}>Your goals, bookmarks and sample practice progress are stored on this device. Cloud sync and official PDF downloads are not connected.</BodyText>
      </Card>
    </Screen>
  );
}