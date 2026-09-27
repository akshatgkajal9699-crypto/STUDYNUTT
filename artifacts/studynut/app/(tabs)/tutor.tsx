import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Keyboard, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BodyText, Card, PageTitle, Screen, Tag, uiStyles } from '@/components/studynut-ui';
import { useStudy } from '@/context/StudyProvider';
import { useColors } from '@/hooks/useColors';

type ChatMessage = {
  id: string;
  role: 'student' | 'tutor';
  text: string;
};

const STARTER_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'tutor',
  text: 'Hi! I can help you think through a study question. This preview uses built-in study guides; live NutAI answers and image solving are not connected yet.',
};

const SUGGESTIONS = [
  'Explain photosynthesis',
  'Solve 2x + 5 = 13',
  'What does “evaluate” mean?',
];

function makeStudyGuideReply(prompt: string, grade: number) {
  const text = prompt.toLowerCase();
  if (text.includes('photosynth')) {
    return 'Think of photosynthesis as a way to store light energy in glucose.\n\n1. Chlorophyll in the leaf absorbs light.\n2. The plant takes in carbon dioxide and water.\n3. Light energy helps rearrange those atoms into glucose and oxygen.\n\nWord equation: carbon dioxide + water → glucose + oxygen. A useful check: light is the energy source, not a raw material.';
  }
  if (text.includes('wave')) {
    return 'For wave speed questions, start with v = fλ.\n\n• v is speed in metres per second (m/s)\n• f is frequency in hertz (Hz)\n• λ is wavelength in metres (m)\n\nFor example, 50 Hz × 0.8 m = 40 m/s. Before calculating, check that your wavelength is in metres.';
  }
  if (text.includes('fraction')) {
    return 'To add fractions, first give them the same denominator. For example:\n\n¾ + ⅛ = 6/8 + 1/8 = 7/8.\n\nThe denominator tells you the size of the pieces; only add the numerators once those pieces are the same size.';
  }
  if (text.includes('evaluate') || text.includes('command term')) {
    return 'In an exam, “evaluate” means make a supported judgement. A strong answer usually:\n\n1. Gives evidence for more than one side.\n2. Explains why each point matters.\n3. Reaches a clear conclusion that follows from the evidence.\n\nTry not to stop at describing: the judgement is the important final step.';
  }
  const equation = text.match(/(-?\d*)\s*x\s*([+-])\s*(\d+)\s*=\s*(-?\d+)/);
  if (equation) {
    const coefficient = Number(equation[1] || 1);
    const adjustment = Number(equation[3]) * (equation[2] === '-' ? -1 : 1);
    const total = Number(equation[4]);
    const x = (total - adjustment) / coefficient;
    return `Let’s keep both sides balanced.\n\n${prompt.trim()}\n1. ${adjustment >= 0 ? `Subtract ${adjustment}` : `Add ${Math.abs(adjustment)}`} on both sides.\n2. ${coefficient}x = ${total - adjustment}.\n3. Divide both sides by ${coefficient}.\n\nSo x = ${x}. Check it by substituting ${x} back into the original equation.`;
  }
  if (text.includes('equation') || text.includes('algebra') || text.includes('solve')) {
    return 'A reliable algebra method is to undo operations in reverse order while keeping both sides balanced.\n\nTry this small example: 2x + 5 = 13. Subtract 5 from both sides (2x = 8), then divide both sides by 2 (x = 4). Check your result in the original equation.\n\nShare the exact equation and I can help you set up the steps.';
  }
  return `Let’s break it down at Grade ${grade} level.\n\n1. Identify what the question is asking you to find or explain.\n2. Write down the relevant fact, rule, or equation.\n3. Work through one step at a time and check that your units or evidence fit.\n\nTell me the subject and the exact question, and I’ll help you plan the first step.`;
}

export default function TutorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data } = useStudy();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER_MESSAGE]);
  const [draft, setDraft] = useState('');
  function sendMessage(text = draft) {
    const prompt = text.trim();
    if (!prompt) return;
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-student`, role: 'student', text: prompt },
      {
        id: `${Date.now()}-guide`,
        role: 'tutor',
        text: makeStudyGuideReply(prompt, data.grade),
      },
    ]);
    setDraft('');
    Keyboard.dismiss();
  }

  return (
    <Screen
      scroll={false}
      contentStyle={{
        flex: 1,
        gap: 12,
        paddingBottom: Platform.OS === 'web' ? 102 : insets.bottom + 92,
      }}
    >
      <PageTitle
        eyebrow="NUTAI · STUDY GUIDE"
        title="Ask a question"
        subtitle="A calm place to work through a tricky idea."
        right={<Tag tone="warning">Preview</Tag>}
      />
      <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Feather name="info" size={16} color={colors.primary} />
        <Text style={{ flex: 1, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }}>
           Built-in guide mode. Use the exam tools for a paper-scan preview or a spoken Ghost Mode session.
        </Text>
      </Card>
      <View style={[uiStyles.row, uiStyles.gap8]}>
        <View style={{ flex: 1 }}>
          <Pressable
            accessibilityRole="button"
            testID="tutor-paper-scan"
            onPress={() => router.push('/scan')}
            style={({ pressed }) => ({
              minHeight: 43,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              flexDirection: 'row',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Feather name="camera" size={15} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>Scan working</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <Pressable
            accessibilityRole="button"
            testID="tutor-ghost-mode"
            onPress={() => router.push('/ghost')}
            style={({ pressed }) => ({
              minHeight: 43,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              flexDirection: 'row',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Feather name="mic" size={15} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>Ghost Mode</Text>
          </Pressable>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            accessibilityRole="button"
            testID={`tutor-suggestion-${suggestion.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}
            onPress={() => sendMessage(suggestion)}
            style={({ pressed }) => ({
              borderRadius: 99,
              paddingHorizontal: 11,
              paddingVertical: 8,
              backgroundColor: colors.primarySoft,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>{suggestion}</Text>
          </Pressable>
        ))}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1, minHeight: 160 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          inverted
          data={[...messages].reverse()}
          keyExtractor={(message) => message.id}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 10 }}
          renderItem={({ item }) => {
            const isStudent = item.role === 'student';
            return (
              <View style={{ alignItems: isStudent ? 'flex-end' : 'flex-start' }}>
                <View style={{
                  maxWidth: '92%',
                  borderRadius: 18,
                  borderBottomRightRadius: isStudent ? 6 : 18,
                  borderBottomLeftRadius: isStudent ? 18 : 6,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: isStudent ? colors.primary : colors.card,
                  borderWidth: isStudent ? 0 : 1,
                  borderColor: colors.border,
                }}>
                  {!isStudent ? (
                    <View style={[uiStyles.row, uiStyles.gap8, { marginBottom: 6 }]}>
                      <Feather name="book-open" size={13} color={colors.emerald} />
                      <Text style={{ color: colors.emerald, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.6 }}>STUDY GUIDE</Text>
                    </View>
                  ) : null}
                  <Text style={{
                    color: isStudent ? '#FFFFFF' : colors.foreground,
                    fontFamily: 'Inter_400Regular',
                    fontSize: 13,
                    lineHeight: 20,
                  }}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 9,
          padding: 8,
          borderRadius: 19,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}>
          <TextInput
            accessibilityLabel="Ask the study guide a question"
            testID="tutor-input"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => sendMessage()}
            placeholder="Ask about a topic or question…"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="send"
            multiline
            maxLength={500}
            style={{
              flex: 1,
              maxHeight: 110,
              minHeight: 40,
              paddingHorizontal: 8,
              paddingVertical: 9,
              color: colors.foreground,
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              lineHeight: 20,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send question"
            testID="tutor-send"
            disabled={!draft.trim()}
            onPress={() => sendMessage()}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: draft.trim() ? colors.primary : colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Feather name="arrow-up" size={19} color={draft.trim() ? colors.primaryForeground : colors.mutedForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}