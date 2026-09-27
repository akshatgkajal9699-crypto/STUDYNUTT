import React, { useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  ActionButton,
  BodyText,
  Card,
  PageTitle,
  ProgressBar,
  Screen,
  Tag,
  uiStyles,
} from '@/components/studynut-ui';
import { useStudy } from '@/context/StudyProvider';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/revenuecat';

type GhostStatus = 'idle' | 'active' | 'complete';

const PROMPTS = [
  {
    command: 'Explain',
    question: 'Explain the key idea in your own words, then connect it to one example.',
    rubric: 'A strong explanation links a clear idea to why it happens or matters.',
  },
  {
    command: 'Apply',
    question: 'Apply what you know to a new situation. What would you do first?',
    rubric: 'Start with a relevant rule, then show how the details of the situation fit it.',
  },
  {
    command: 'Evaluate',
    question: 'Evaluate one possible answer. What is its strongest point and its limitation?',
    rubric: 'Make a supported judgement instead of listing points without a conclusion.',
  },
];

const GHOST_TIPS: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  detail: string;
}[] = [
  { icon: 'volume-2', title: 'Listen to the command term', detail: 'Hear the question with a calm examiner voice.' },
  { icon: 'message-circle', title: 'Answer without a model answer', detail: 'Build the habit of explaining before you look anything up.' },
  { icon: 'target', title: 'Finish with a judgement', detail: 'Use the command term to decide what your answer must include.' },
];

export default function GhostScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data } = useStudy();
  const { isPro, consumeGhostSession } = useSubscription();
  const [status, setStatus] = useState<GhostStatus>('idle');
  const [promptIndex, setPromptIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answered, setAnswered] = useState(0);
  const limit = isPro ? 300 : 60;
  const prompt = useMemo(() => PROMPTS[promptIndex % PROMPTS.length], [promptIndex]);

  useEffect(() => {
    if (status !== 'active') return;
    const timer = setInterval(() => {
      setSeconds((current) => {
        if (current + 1 >= limit) {
          setStatus('complete');
          void Speech.stop();
          return limit;
        }
        return current + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [limit, status]);

  useEffect(() => {
    return () => {
      void Speech.stop();
    };
  }, []);

  function readPrompt() {
    void Speech.stop();
    Speech.speak(prompt.question, { rate: 0.92, pitch: 1.02 });
  }

  async function begin() {
    const allowed = await consumeGhostSession();
    if (!allowed) return;
    setStatus('active');
    setSeconds(0);
    setPromptIndex(0);
    setAnswered(0);
    setAnswer('');
    setTimeout(() => {
      Speech.speak(PROMPTS[0].question, { rate: 0.92, pitch: 1.02 });
    }, 150);
  }

  function submitAnswer() {
    if (!answer.trim()) return;
    setAnswered((current) => current + 1);
    setAnswer('');
    setPromptIndex((current) => (current + 1) % PROMPTS.length);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      const nextPrompt = PROMPTS[(promptIndex + 1) % PROMPTS.length];
      Speech.speak(nextPrompt.question, { rate: 0.92, pitch: 1.02 });
    }, 150);
  }

  if (status === 'complete') {
    return (
      <Screen>
        <PageTitle eyebrow="GHOST MODE · SESSION COMPLETE" title="Good thinking" subtitle="Review the habits that make spoken answers stronger." />
        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 24, backgroundColor: colors.emeraldSoft, borderColor: colors.emeraldSoft }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}>
            <Feather name="check" size={24} color={colors.emerald} />
          </View>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 21 }}>{answered} answers attempted</Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13 }}>{seconds} seconds of examiner practice</Text>
        </Card>
        <View style={{ gap: 10 }}>
          {['Name the idea before giving detail.', 'Use the command term as a checklist.', 'Finish with a clear judgement when asked to evaluate.'].map((item) => (
            <View key={item} style={[uiStyles.row, uiStyles.gap12]}>
              <Feather name="check-circle" size={17} color={colors.emerald} />
              <Text style={{ flex: 1, color: colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19 }}>{item}</Text>
            </View>
          ))}
        </View>
        <ActionButton title="Run another session" icon="repeat" onPress={() => setStatus('idle')} testID="ghost-again" />
        <ActionButton title="Back to NutAI" icon="arrow-left" variant="quiet" onPress={() => router.back()} testID="ghost-back-complete" />
      </Screen>
    );
  }

  if (status === 'active') {
    return (
      <Screen>
        <View style={uiStyles.between}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 17 }}>Socratic Ghost Mode</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>{data.subject} · prompt {promptIndex + 1} of {PROMPTS.length}</Text>
          </View>
          <Tag tone={seconds > limit - 15 ? 'warning' : isPro ? 'green' : 'primary'}>{`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}</Tag>
        </View>
        <ProgressBar progress={seconds / limit} color={seconds > limit - 15 ? colors.warning : colors.primary} />
        <Card style={{ flex: 1, justifyContent: 'center', gap: 15 }}>
          <Tag tone="warning">{prompt.command}</Tag>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 31 }}>{prompt.question}</Text>
          <Pressable
            accessibilityRole="button"
            testID="ghost-read-prompt"
            onPress={readPrompt}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.65 : 1 })}
          >
            <Feather name="volume-2" size={17} color={colors.primary} />
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Read prompt aloud</Text>
          </Pressable>
          <View style={{ padding: 12, borderRadius: 15, backgroundColor: colors.primarySoft }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>{prompt.rubric}</Text>
          </View>
          <TextInput
            accessibilityLabel="Write your spoken answer for the preview"
            testID="ghost-answer"
            multiline
            value={answer}
            onChangeText={setAnswer}
            placeholder="Type the answer you would say…"
            placeholderTextColor={colors.mutedForeground}
            style={{
              minHeight: 100,
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
        </Card>
        <ActionButton title="Submit answer" icon="arrow-right" onPress={submitAnswer} disabled={!answer.trim()} testID="ghost-submit" />
        <ActionButton title="End session" icon="x" variant="quiet" onPress={() => { void Speech.stop(); setStatus('complete'); }} testID="ghost-end" />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageTitle
        eyebrow="NUTAI · ORAL PRACTICE"
        title="Socratic Ghost Mode"
        subtitle="Practise answering like an examiner is in the room."
        right={<Tag tone={isPro ? 'green' : 'primary'}>{isPro ? 'PRO' : '60 SEC TRIAL'}</Tag>}
      />
      <Card style={{ gap: 13, backgroundColor: colors.surfaceRaised }}>
        <View style={[uiStyles.row, uiStyles.gap12]}>
          <View style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
            <Feather name="mic" size={21} color={colors.primaryForeground} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 }}>A quick viva for {data.subject}</Text>
            <BodyText style={{ fontSize: 12 }}>The device reads each prompt aloud. Type your response in this preview and use the rubric to self-check.</BodyText>
          </View>
        </View>
      </Card>
      <View style={{ gap: 12 }}>
        {GHOST_TIPS.map((item) => (
          <View key={item.title} style={[uiStyles.row, uiStyles.gap12]}>
            <View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
              <Feather name={item.icon} size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{item.title}</Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>
      <ActionButton title="Start Ghost Mode" icon="mic" onPress={begin} testID="ghost-start" />
      <BodyText style={{ textAlign: 'center', fontSize: 11 }}>
        {isPro ? 'PRO sessions run for up to five minutes.' : 'Free includes one 60-second session each month.'}
      </BodyText>
      <ActionButton title="Back to NutAI" icon="arrow-left" variant="quiet" onPress={() => router.back()} testID="ghost-back" />
    </Screen>
  );
}