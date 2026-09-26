import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ActionButton,
  BodyText,
  Card,
  PageTitle,
  Screen,
  SectionHeading,
  Tag,
  uiStyles,
} from '@/components/studynut-ui';
import { useStudy } from '@/context/StudyProvider';
import {
  LEARNING_CONTENT,
  type StudyChapter,
  type StudyFlashcard,
  type SubjectLearningPack,
} from '@/data/learning-content';
import { subjectsForGrade } from '@/data/questions';
import { useColors } from '@/hooks/useColors';

type LibraryMode = 'textbooks' | 'flashcards' | 'mindmaps';
const MODES: { id: LibraryMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'textbooks', label: 'Study books', icon: 'book-open' },
  { id: 'flashcards', label: 'Flashcards', icon: 'copy' },
  { id: 'mindmaps', label: 'Mind maps', icon: 'git-branch' },
];

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function createGuideHtml(subject: string, grade: number, pack: SubjectLearningPack) {
  const chapters = pack.chapters
    .map(
      (item, index) => `
        <section class="chapter">
          <p class="eyebrow">CHAPTER ${index + 1}</p>
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.summary)}</p>
          <div class="example"><strong>Worked example</strong><br>${escapeHtml(item.workedExample)}</div>
          <h3>Quick recall</h3>
          <ul>${item.flashcards
            .map(
              (card) =>
                `<li><strong>${escapeHtml(card.front)}</strong><br>${escapeHtml(card.back)}</li>`,
            )
            .join('')}</ul>
        </section>
      `,
    )
    .join('');

  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>${escapeHtml(subject)} · STUDYNUT</title>
      <style>
        @page { margin: 18mm; }
        body { color:#172033; font-family:Arial,sans-serif; line-height:1.65; max-width:760px; margin:0 auto; }
        .brand { color:#4f46e5; font-size:12px; font-weight:700; letter-spacing:2px; }
        .eyebrow { color:#4f46e5; font-size:10px; font-weight:700; letter-spacing:1.5px; }
        h1 { font-size:30px; line-height:1.2; margin:8px 0; }
        h2 { font-size:21px; margin:3px 0 12px; }
        h3 { font-size:14px; margin:18px 0 5px; }
        .intro { color:#526077; }
        .chapter { break-inside:avoid; border-top:1px solid #dbe2ec; margin-top:24px; padding-top:12px; }
        .example { background:#f1f5f9; border-left:3px solid #4f46e5; padding:12px 14px; margin:14px 0; }
        li { margin:8px 0; }
        footer { border-top:1px solid #dbe2ec; color:#64748b; font-size:10px; margin-top:32px; padding-top:10px; }
      </style>
    </head><body>
      <p class="brand">STUDYNUT · ORIGINAL STUDY NOTES</p>
      <h1>${escapeHtml(subject)}</h1>
      <p class="intro">Grade ${grade} quick-reference guide. ${escapeHtml(pack.overview)}</p>
      ${chapters}
      <footer>Original STUDYNUT learning notes. Not an official Cambridge, IB, or exam-board textbook or mark scheme.</footer>
    </body></html>`;
}

function FlashcardDeck({
  subject,
  cards,
  colors,
}: {
  subject: string;
  cards: StudyFlashcard[];
  colors: ReturnType<typeof useColors>;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const currentCard = cards[index];

  function moveTo(nextIndex: number) {
    setIndex((nextIndex + cards.length) % cards.length);
    setRevealed(false);
  }

  if (!currentCard) return null;

  return (
    <View style={{ gap: 13 }}>
      <View style={[uiStyles.between]}>
        <SectionHeading title={`${subject} flashcards`} />
        <Tag tone="neutral">{index + 1} / {cards.length}</Tag>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={revealed ? 'Hide flashcard answer' : 'Reveal flashcard answer'}
        accessibilityHint="Tap to flip between the question and answer."
        testID="flashcard"
        onPress={() => setRevealed((current) => !current)}
        style={({ pressed }) => ({
          minHeight: 258,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: revealed ? colors.primarySoft : colors.card,
          padding: 26,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Feather
          name={revealed ? 'check-circle' : 'help-circle'}
          size={25}
          color={colors.primary}
        />
        <Text style={{
          color: colors.mutedForeground,
          fontFamily: 'Inter_700Bold',
          fontSize: 11,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        }}>
          {revealed ? 'Answer' : 'Think, then tap to reveal'}
        </Text>
        <Text style={{
          color: colors.foreground,
          fontFamily: 'Inter_600SemiBold',
          fontSize: 20,
          lineHeight: 29,
          textAlign: 'center',
        }}>
          {revealed ? currentCard.back : currentCard.front}
        </Text>
      </Pressable>
      <View style={[uiStyles.row, uiStyles.gap8]}>
        <ActionButton
          title="Previous"
          icon="arrow-left"
          variant="secondary"
          compact
          onPress={() => moveTo(index - 1)}
          testID="flashcard-previous"
        />
        <View style={{ flex: 1 }}>
          <ActionButton
            title={revealed ? 'Hide answer' : 'Reveal answer'}
            icon={revealed ? 'eye-off' : 'eye'}
            onPress={() => setRevealed((current) => !current)}
            testID="flashcard-reveal"
          />
        </View>
        <ActionButton
          title="Next"
          icon="arrow-right"
          variant="secondary"
          compact
          onPress={() => moveTo(index + 1)}
          testID="flashcard-next"
        />
      </View>
      <BodyText style={{ fontSize: 12 }}>
        Say the answer in your own words before flipping the card.
      </BodyText>
    </View>
  );
}

function MindMap({
  subject,
  pack,
  colors,
  wide,
}: {
  subject: string;
  pack: SubjectLearningPack;
  colors: ReturnType<typeof useColors>;
  wide: boolean;
}) {
  return (
    <View style={{ gap: 14 }}>
      <SectionHeading title={`${subject} mind map`} />
      <View style={{
        borderRadius: 22,
        backgroundColor: colors.primarySoft,
        padding: 18,
        alignItems: 'center',
        gap: 5,
      }}>
        <Tag>{subject}</Tag>
        <Text style={{
          color: colors.foreground,
          fontFamily: 'Inter_700Bold',
          fontSize: 19,
          textAlign: 'center',
        }}>
          {subject}: key ideas
        </Text>
        <BodyText style={{ fontSize: 12, textAlign: 'center' }}>
          {pack.overview}
        </BodyText>
      </View>
      <View style={{ alignSelf: 'center', width: 2, height: 22, backgroundColor: colors.border }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
        {pack.chapters.map((item, index) => (
          <View
            key={item.title}
            style={{
              width: wide ? '31%' : '100%',
              flexGrow: 1,
              maxWidth: wide ? 380 : undefined,
            }}
          >
            <Card style={{
              height: '100%',
              backgroundColor: index === 1 ? colors.surfaceRaised : colors.card,
            }}>
              <View style={[uiStyles.row, uiStyles.gap8]}>
                <View style={{
                  width: 27,
                  height: 27,
                  borderRadius: 10,
                  backgroundColor: colors.emeraldSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: colors.emerald, fontFamily: 'Inter_700Bold', fontSize: 12 }}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={{
                  color: colors.foreground,
                  fontFamily: 'Inter_700Bold',
                  fontSize: 14,
                  flex: 1,
                }}>
                  {item.title}
                </Text>
              </View>
              <BodyText style={{ fontSize: 12, lineHeight: 18 }}>{item.summary}</BodyText>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <Text style={{
                color: colors.mutedForeground,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 10,
                letterSpacing: 0.7,
                textTransform: 'uppercase',
              }}>
                Connect it
              </Text>
              <BodyText style={{ fontSize: 12 }}>{item.workedExample}</BodyText>
            </Card>
          </View>
        ))}
      </View>
    </View>
  );
}

function StudyBook({
  subject,
  grade,
  pack,
  colors,
  onExportPdf,
  exporting,
  exportMessage,
}: {
  subject: string;
  grade: number;
  pack: SubjectLearningPack;
  colors: ReturnType<typeof useColors>;
  onExportPdf: () => void;
  exporting: boolean;
  exportMessage: string;
}) {
  const [openChapter, setOpenChapter] = useState(0);

  return (
    <View style={{ gap: 13 }}>
      <SectionHeading title={`${subject} study book`} action={`Grade ${grade}`} />
      <Card style={{ backgroundColor: colors.surfaceRaised }}>
        <View style={[uiStyles.row, uiStyles.gap8]}>
          <Feather name="book-open" size={19} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 }}>
            Original revision guide
          </Text>
        </View>
        <BodyText>{pack.overview}</BodyText>
        <Tag tone="warning">Study notes · not an official full textbook</Tag>
        <ActionButton
          title="Print or save as PDF"
          icon={exporting ? undefined : 'download'}
          loading={exporting}
          onPress={onExportPdf}
          testID="study-guide-pdf"
        />
        {exporting ? (
          <View style={[uiStyles.row, uiStyles.gap8]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <BodyText style={{ fontSize: 12 }}>Preparing your study guide…</BodyText>
          </View>
        ) : null}
        {exportMessage ? (
          <BodyText style={{ fontSize: 12 }}>{exportMessage}</BodyText>
        ) : null}
        <BodyText style={{ fontSize: 11 }}>
          On a laptop, choose “Save as PDF” in the print window. On a phone or tablet, use the share or print options.
        </BodyText>
      </Card>

      <SectionHeading title="Chapters" action={`${pack.chapters.length} short units`} />
      {pack.chapters.map((item, index) => {
        const expanded = openChapter === index;
        return (
          <Card key={item.title} style={{ gap: 0 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${expanded ? 'Collapse' : 'Open'} chapter ${index + 1}: ${item.title}`}
              onPress={() => setOpenChapter(expanded ? -1 : index)}
              style={({ pressed }) => [
                uiStyles.between,
                { gap: 14, paddingVertical: 2, opacity: pressed ? 0.76 : 1 },
              ]}
            >
              <View style={[uiStyles.row, uiStyles.gap12, { flex: 1 }]}>
                <Tag tone="neutral">{String(index + 1).padStart(2, '0')}</Tag>
                <Text style={{
                  flex: 1,
                  color: colors.foreground,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 14,
                }}>
                  {item.title}
                </Text>
              </View>
              <Feather name={expanded ? 'minus' : 'plus'} size={18} color={colors.primary} />
            </Pressable>
            {expanded ? (
              <View style={{ paddingTop: 13, gap: 11 }}>
                <BodyText>{item.summary}</BodyText>
                <View style={{ borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 12, gap: 4 }}>
                  <Text style={{
                    color: colors.primary,
                    fontFamily: 'Inter_700Bold',
                    fontSize: 11,
                    textTransform: 'uppercase',
                  }}>
                    Worked example
                  </Text>
                  <BodyText style={{ fontSize: 13 }}>{item.workedExample}</BodyText>
                </View>
                {item.flashcards.map((card) => (
                  <View key={card.front} style={{ gap: 3 }}>
                    <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
                      {card.front}
                    </Text>
                    <BodyText style={{ fontSize: 12 }}>{card.back}</BodyText>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

export default function LearningLibraryScreen() {
  const { data } = useStudy();
  const colors = useColors();
  const router = useRouter();
  const subjects = subjectsForGrade(data.grade);
  const [subject, setSubject] = useState(data.subject);
  const [mode, setMode] = useState<LibraryMode>('textbooks');
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const { width } = useWindowDimensions();
  const wide = width >= 800;
  const selectedSubject = subjects.includes(subject)
    ? subject
    : subjects.includes(data.subject)
      ? data.subject
      : subjects[0];
  const pack = (LEARNING_CONTENT as Record<string, SubjectLearningPack>)[selectedSubject];
  const allCards = pack?.chapters.flatMap((item: StudyChapter) => item.flashcards) ?? [];

  async function exportPdf() {
    if (!pack) return;
    setExporting(true);
    setExportMessage('');
    try {
      const html = createGuideHtml(selectedSubject, data.grade, pack);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        setExportMessage('Use “Save as PDF” in the browser print window to download this guide.');
      } else {
        const file = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Save ${selectedSubject} study guide`,
            UTI: 'com.adobe.pdf',
          });
          setExportMessage('Your PDF is ready to save or share.');
        } else {
          await Print.printAsync({ html });
          setExportMessage('Your guide is ready in the system print window.');
        }
      }
    } catch {
      setExportMessage('The PDF could not be prepared. Please try again or check your device’s print settings.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen>
      <View style={[uiStyles.row, uiStyles.gap12]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <PageTitle
            eyebrow="STUDYNUT LEARNING LIBRARY"
            title="Learn your way"
            subtitle={`Grade ${data.grade} · original subject guides, cards and maps`}
          />
        </View>
      </View>

      <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}>
        <View style={[uiStyles.row, uiStyles.gap12]}>
          <Feather name="layers" size={20} color={colors.primary} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 }}>
              Textbooks, flashcards and mind maps
            </Text>
            <BodyText style={{ fontSize: 12 }}>
              Choose a subject below. Each guide is written for STUDYNUT and can be printed or saved as a PDF.
            </BodyText>
          </View>
        </View>
      </Card>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Choose a subject" action={`${subjects.length} subjects`} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {subjects.map((item) => {
            const active = item === selectedSubject;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`library-subject-${item.toLowerCase().replaceAll(' ', '-')}`}
                onPress={() => {
                  setSubject(item);
                  setExportMessage('');
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 99,
                  backgroundColor: active ? colors.primary : colors.card,
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{
                  color: active ? colors.primaryForeground : colors.foreground,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 12,
                }}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MODES.map((item) => {
          const active = item.id === mode;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              testID={`library-mode-${item.id}`}
              onPress={() => setMode(item.id)}
              style={({ pressed }) => ({
                minWidth: wide ? 150 : '31%',
                flexGrow: 1,
                minHeight: 45,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                paddingHorizontal: 10,
                borderRadius: 14,
                backgroundColor: active ? colors.primary : colors.card,
                borderWidth: active ? 0 : 1,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Feather
                name={item.icon}
                size={15}
                color={active ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text style={{
                color: active ? colors.primaryForeground : colors.foreground,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 12,
              }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!pack ? (
        <Card>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 }}>
            This subject guide is not available yet
          </Text>
          <BodyText>Choose another subject, or contact us if you expected a guide here.</BodyText>
        </Card>
      ) : mode === 'textbooks' ? (
        <StudyBook
          key={`${selectedSubject}-${data.grade}`}
          subject={selectedSubject}
          grade={data.grade}
          pack={pack}
          colors={colors}
          onExportPdf={exportPdf}
          exporting={exporting}
          exportMessage={exportMessage}
        />
      ) : mode === 'flashcards' ? (
        <FlashcardDeck
          key={selectedSubject}
          subject={selectedSubject}
          cards={allCards}
          colors={colors}
        />
      ) : (
        <MindMap
          key={selectedSubject}
          subject={selectedSubject}
          pack={pack}
          colors={colors}
          wide={wide}
        />
      )}
    </Screen>
  );
}