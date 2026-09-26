import React from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { ActionButton, BodyText, Card, PageTitle, ProgressBar, Screen, SectionHeading, Tag, uiStyles } from '@/components/studynut-ui';
import { useStudy } from '@/context/StudyProvider';
import { useColors } from '@/hooks/useColors';
import { findQuestion, subjectsForGrade } from '@/data/questions';

function stageForGrade(grade: number) {
  return `Stage ${grade + 1}`;
}

function examWindowLabel() {
  const now = new Date();
  let checkpoint = new Date(now.getFullYear(), 4, 31);
  if (checkpoint.getTime() <= now.getTime()) {
    checkpoint = new Date(now.getFullYear() + 1, 4, 31);
  }
  const days = Math.ceil((checkpoint.getTime() - now.getTime()) / 86_400_000);
  return { date: checkpoint.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }), days };
}

export default function HomeScreen() {
  const { data, setSubject } = useStudy();
  const colors = useColors();
  const router = useRouter();
  const questions = subjectsForGrade(data.grade).slice(0, 4);
  const questionProgress = Math.min(
    1,
    data.todayQuestions / Math.max(1, data.dailyTargetQuestions),
  );
  const minuteProgress = Math.min(
    1,
    data.todayMinutes / Math.max(1, data.dailyTargetMinutes),
  );
  const countdown = examWindowLabel();

  return (
    <Screen>
      <View style={[uiStyles.between, { marginBottom: 1 }]}>
        <View style={[uiStyles.row, uiStyles.gap8]}>
          <View style={{
            width: 38,
            height: 38,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primarySoft,
          }}>
            <Feather name="book-open" size={19} color={colors.primary} />
          </View>
          <View>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 1.3 }}>STUDYNUT</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 11 }}>{stageForGrade(data.grade)} · Grade {data.grade}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile and settings"
          testID="home-profile-button"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Feather name="user" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <PageTitle
        eyebrow="A little progress, every day"
        title="Ready for a win?"
        subtitle="Your next good study session starts here."
      />

      <LinearGradient
        colors={[colors.primary, colors.secondaryForeground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 26, padding: 20, gap: 17 }}
      >
        <View style={[uiStyles.between]}>
          <Tag tone="green">Today's focus</Tag>
          <View style={[uiStyles.row, uiStyles.gap8]}>
            <Feather name="zap" size={16} color="#C7D2FE" />
            <Text style={{ color: '#F8FAFC', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
              {data.streakDays} day streak
            </Text>
          </View>
        </View>
        <View style={uiStyles.between}>
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 23, letterSpacing: -0.6 }}>
              Keep your momentum
            </Text>
            <Text style={{ color: '#E0E7FF', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 }}>
              {data.todayQuestions === 0
                ? 'A focused 10-minute session is a great place to begin.'
                : `${data.todayQuestions} question${data.todayQuestions === 1 ? '' : 's'} done. Keep going at your pace.`}
            </Text>
          </View>
          <View style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.13)',
            marginLeft: 12,
          }}>
            <Feather name="arrow-up-right" size={25} color="#FFFFFF" />
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <View style={uiStyles.between}>
            <Text style={{ color: '#E0E7FF', fontFamily: 'Inter_500Medium', fontSize: 12 }}>Daily question goal</Text>
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 12 }}>
              {data.todayQuestions} / {data.dailyTargetQuestions}
            </Text>
          </View>
          <ProgressBar progress={questionProgress} color={colors.emerald} height={7} />
        </View>
        <ActionButton
          title="Start a practice set"
          icon="arrow-right"
          variant="secondary"
          onPress={() => router.push('/practice')}
          testID="home-start-practice"
        />
      </LinearGradient>

      <View style={[uiStyles.row, uiStyles.gap12]}>
        <Card style={{ flex: 1, padding: 15, gap: 9 }}>
          <View style={[uiStyles.row, uiStyles.gap8]}>
            <Feather name="clock" size={15} color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>STUDY TIME</Text>
          </View>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 23 }}>{data.todayMinutes}<Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium' }}> min</Text></Text>
          <ProgressBar progress={minuteProgress} color={colors.primary} height={6} />
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11 }}>Goal: {data.dailyTargetMinutes} min</Text>
        </Card>
        <Card style={{ flex: 1, padding: 15, gap: 9 }}>
          <View style={[uiStyles.row, uiStyles.gap8]}>
            <Feather name="award" size={15} color={colors.emerald} />
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>PAPERS FINISHED</Text>
          </View>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 23 }}>{data.completedExams}</Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }}>
            {data.completedExams === 0 ? 'Your first paper is waiting.' : 'Nice work. Keep building confidence.'}
          </Text>
        </Card>
      </View>

      <Card style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surfaceRaised,
        gap: 14,
      }}>
        <View style={[uiStyles.row, uiStyles.gap12, { flex: 1 }]}>
          <View style={{
            width: 42,
            height: 42,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primarySoft,
          }}>
            <Feather name="calendar" size={19} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 }}>Exam season is on the horizon</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
              Planning checkpoint: {countdown.date} · sample date
            </Text>
          </View>
        </View>
        <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 17 }}>{countdown.days}<Text style={{ fontSize: 10 }}>d</Text></Text>
      </Card>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Your subjects" action={`${stageForGrade(data.grade)} syllabus`} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {questions.map((subject, index) => {
            const icon = ['divide-square', 'activity', 'feather', 'globe'][index] as keyof typeof Feather.glyphMap;
            const accent = index % 2 === 0 ? colors.primary : colors.emerald;
            return (
              <Pressable
                key={subject}
                accessibilityRole="button"
                testID={`subject-${subject.toLowerCase().replaceAll(' ', '-')}`}
                onPress={() => {
                  setSubject(subject);
                  router.push('/practice');
                }}
                style={({ pressed }) => ({
                  width: '48%',
                  flexGrow: 1,
                  minHeight: 98,
                  padding: 14,
                  borderWidth: 1,
                  borderRadius: 19,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: pressed ? 0.75 : 1,
                  gap: 11,
                })}
              >
                <View style={[uiStyles.between]}>
                  <Feather name={icon} size={19} color={accent} />
                  <Feather name="arrow-up-right" size={15} color={colors.mutedForeground} />
                </View>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{subject}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Revision vault" action={`${data.bookmarks.length} saved`} />
        {data.weakQuestions.length > 0 ? (
          <Card style={{ backgroundColor: colors.warningSoft, borderColor: colors.warningSoft }}>
            <View style={[uiStyles.row, uiStyles.gap12]}>
              <Feather name="bookmark" size={19} color={colors.warning} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 }}>A few questions to revisit</Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>
                  {data.weakQuestions.length} missed question{data.weakQuestions.length === 1 ? '' : 's'} saved for another look.
                </Text>
              </View>
            </View>
            {data.weakQuestions.slice(0, 2).map((id) => {
              const question = findQuestion(id);
              return question ? (
                <Text key={id} numberOfLines={1} style={{ color: colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>• {question.chapter} · {question.subject}</Text>
              ) : null;
            })}
            <ActionButton title="Review missed questions" icon="rotate-ccw" variant="secondary" onPress={() => router.push('/profile')} compact />
          </Card>
        ) : (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: colors.emeraldSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Feather name="check" size={18} color={colors.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Your revision vault is ready</Text>
              <BodyText style={{ fontSize: 12 }}>Missed and bookmarked questions collect here.</BodyText>
            </View>
          </Card>
        )}
      </View>

      <Card style={{ backgroundColor: colors.surfaceRaised, gap: 12 }}>
        <View style={[uiStyles.row, uiStyles.gap12]}>
          <View style={{
            width: 42,
            height: 42,
            borderRadius: 15,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Feather name="layers" size={19} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 }}>Build your revision library</Text>
            <BodyText style={{ fontSize: 12 }}>Open original study guides, tap-through flashcards, mind maps, and PDF export.</BodyText>
          </View>
        </View>
        <ActionButton title="Open learning library" icon="arrow-right" onPress={() => router.push('/library')} />
      </Card>
    </Screen>
  );
}