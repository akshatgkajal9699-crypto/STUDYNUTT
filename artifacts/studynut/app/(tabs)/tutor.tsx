import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { fetch as expoFetch } from 'expo/fetch';
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

type NutAiRequestMessage = {
  role: 'student' | 'tutor';
  content: string;
};

const STARTER_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'tutor',
  text: 'Hi, I’m NutAI. Ask me about a topic, a homework problem, or an exam question, and I’ll work through it with you.',
};

const MAX_SAVED_MESSAGES = 100;

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;
  if (!('id' in value) || !('role' in value) || !('text' in value)) return false;
  return (
    typeof value.id === 'string' &&
    (value.role === 'student' || value.role === 'tutor') &&
    typeof value.text === 'string'
  );
}

function readSavedMessages(value: string | null): ChatMessage[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChatMessage).slice(-MAX_SAVED_MESSAGES);
  } catch {
    return [];
  }
}

function persistMessages(storageKey: string, messages: ChatMessage[]) {
  return AsyncStorage.setItem(
    storageKey,
    JSON.stringify(messages.slice(-MAX_SAVED_MESSAGES)),
  ).catch((error: unknown) => {
    console.warn('Could not save NutAI chat history.', error);
  });
}

let messageCounter = 0;
function createMessageId() {
  messageCounter += 1;
  return `nutai-${Date.now()}-${messageCounter}`;
}

const SUGGESTIONS = [
  'Explain photosynthesis',
  'Solve 2x + 5 = 13',
  'What does “evaluate” mean?',
];

async function streamNutAiResponse(
  requestBody: {
    grade: number;
    subject: string;
    messages: NutAiRequestMessage[];
  },
  token: string,
  signal: AbortSignal,
  onChunk: (content: string) => void,
) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) {
    throw new Error('NutAI is not configured for this build. Please try again later.');
  }

  const response = await expoFetch(`https://${domain}/api/nutai/chat`, {
    method: 'POST',
    signal,
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const responseText = await response.text();
    let message = 'NutAI couldn’t answer right now. Please try again.';
    try {
      const body = JSON.parse(responseText) as { error?: unknown };
      if (typeof body.error === 'string' && body.error.length > 0) {
        message = body.error;
      }
    } catch {
      if (response.status === 401) {
        message = 'Please sign in to use NutAI.';
      }
    }
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('NutAI could not open a response stream. Please try again.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;

  const readLine = (line: string) => {
    const normalized = line.replace(/\r$/, '');
    if (!normalized.startsWith('data: ')) return;
    const payload = JSON.parse(normalized.slice(6)) as {
      content?: unknown;
      done?: unknown;
      error?: unknown;
    };
    if (typeof payload.error === 'string') {
      throw new Error(payload.error);
    }
    if (typeof payload.content === 'string' && payload.content.length > 0) {
      onChunk(payload.content);
    }
    if (payload.done === true) completed = true;
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) readLine(line);
    if (done) break;
  }
  if (buffer.trim()) readLine(buffer);
  if (!completed) {
    throw new Error('NutAI’s connection ended early. Please try again.');
  }
}

export default function TutorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data } = useStudy();
  const router = useRouter();
  const { getToken, isSignedIn, userId } = useAuth();
  const historyStorageKey = `@studynut/nutai-chat-v1:${encodeURIComponent(userId ?? 'guest')}`;
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER_MESSAGE]);
  const [loadedHistoryKey, setLoadedHistoryKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const sendingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const historyReady = loadedHistoryKey === historyStorageKey;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(historyStorageKey)
      .then((stored) => {
        if (!active) return;
        const savedMessages = readSavedMessages(stored);
        setMessages(savedMessages.length > 0 ? savedMessages : [STARTER_MESSAGE]);
      })
      .catch((error: unknown) => {
        console.warn('Could not restore NutAI chat history.', error);
        if (active) setMessages([STARTER_MESSAGE]);
      })
      .finally(() => {
        if (active) setLoadedHistoryKey(historyStorageKey);
      });
    return () => {
      active = false;
    };
  }, [historyStorageKey]);

  useEffect(() => {
    if (!historyReady || isSending) return;
    void persistMessages(historyStorageKey, messages);
  }, [historyReady, historyStorageKey, isSending, messages]);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  async function sendMessage(text = draft) {
    const prompt = text.trim();
    if (!prompt || !historyReady || sendingRef.current) return;
    sendingRef.current = true;
    const priorMessages: NutAiRequestMessage[] = messages
      .filter((message) => message.id !== 'welcome' && message.text.trim().length > 0)
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: message.text,
      }));
    const studentMessage: ChatMessage = {
      id: createMessageId(),
      role: 'student',
      text: prompt,
    };
    const messagesWithPrompt = [...messages, studentMessage].slice(-MAX_SAVED_MESSAGES);
    const tutorMessageId = createMessageId();
    let fullResponse = '';
    let tutorMessageAdded = false;

    setMessages(messagesWithPrompt);
    void persistMessages(historyStorageKey, messagesWithPrompt);
    setDraft('');
    setIsSending(true);
    setShowTyping(true);
    Keyboard.dismiss();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      if (!isSignedIn) {
        throw new Error('Please sign in to use NutAI.');
      }
      const token = await getToken();
      if (!token) {
        throw new Error('Please sign in to use NutAI.');
      }

      await streamNutAiResponse(
        {
          grade: data.grade,
          subject: data.subject,
          messages: [
            ...priorMessages,
            { role: 'student', content: prompt },
          ],
        },
        token,
        controller.signal,
        (content) => {
          fullResponse += content;
          setShowTyping(false);
          if (!tutorMessageAdded) {
            tutorMessageAdded = true;
            setMessages((current) => [
              ...current,
              { id: tutorMessageId, role: 'tutor', text: fullResponse },
            ]);
            return;
          }
          setMessages((current) =>
            current.map((message) =>
              message.id === tutorMessageId
                ? { ...message, text: fullResponse }
                : message,
            ),
          );
        },
      );
      if (!tutorMessageAdded) {
        throw new Error('NutAI returned an empty answer. Please try again.');
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      const message =
        error instanceof Error
          ? error.message
          : 'NutAI couldn’t answer right now. Please try again.';
      setMessages((current) => {
        if (!tutorMessageAdded) {
          return [
            ...current,
            { id: tutorMessageId, role: 'tutor', text: message },
          ];
        }
        return current.map((item) =>
          item.id === tutorMessageId
            ? { ...item, text: `${item.text}\n\n${message}` }
            : item,
        );
      });
    } finally {
      sendingRef.current = false;
      setIsSending(false);
      setShowTyping(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }

  const canSend = draft.trim().length > 0 && !isSending && historyReady;

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
        eyebrow="NUTAI · AI STUDY TUTOR"
        title="Ask a question"
        subtitle="A calm place to work through a tricky idea, one step at a time."
        right={<Tag tone="green">LIVE AI</Tag>}
      />
      <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Feather name="info" size={16} color={colors.primary} />
        <Text style={{ flex: 1, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }}>
          NutAI uses your grade, subject, and recent chat to tailor each answer. Your chat history is saved on this device.
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
            disabled={isSending || !historyReady}
            onPress={() => sendMessage(suggestion)}
            style={({ pressed }) => ({
              borderRadius: 99,
              paddingHorizontal: 11,
              paddingVertical: 8,
              backgroundColor: colors.primarySoft,
              opacity: isSending ? 0.5 : pressed ? 0.7 : 1,
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
          data={historyReady ? [...messages].reverse() : []}
          keyExtractor={(message) => message.id}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            showTyping ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
                  NutAI is thinking…
                </Text>
              </View>
            ) : null
          }
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
                      <Feather name="zap" size={13} color={colors.emerald} />
                      <Text style={{ color: colors.emerald, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.6 }}>NUTAI</Text>
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
            accessibilityLabel="Ask NutAI a question"
            testID="tutor-input"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => sendMessage()}
            placeholder={historyReady ? 'Ask NutAI about a topic or question…' : 'Loading saved chat…'}
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="send"
            multiline
            maxLength={500}
            editable={historyReady && !isSending}
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
            accessibilityLabel="Send question to NutAI"
            testID="tutor-send"
            disabled={!canSend}
            onPress={() => sendMessage()}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: canSend ? colors.primary : colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !canSend ? 0.6 : pressed ? 0.8 : 1,
            })}
          >
            <Feather name="arrow-up" size={19} color={canSend ? colors.primaryForeground : colors.mutedForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}