import React, { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  ActionButton,
  BodyText,
  Card,
  PageTitle,
  Screen,
  Tag,
  uiStyles,
} from '@/components/studynut-ui';
import { useStudy } from '@/context/StudyProvider';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/revenuecat';

type Photo = {
  uri: string;
  width?: number;
  height?: number;
};

const REVIEW_CHECKS = [
  {
    title: 'Method is visible',
    detail: 'Your working is spaced out enough to follow each step.',
  },
  {
    title: 'Units are included',
    detail: 'Every final measurement has a unit where one is needed.',
  },
  {
    title: 'Answer is labelled',
    detail: 'The final answer is easy to find and matches the question.',
  },
];

export default function ScanScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data } = useStudy();
  const { isPro, consumeHandwrittenScan } = useSubscription();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(() => REVIEW_CHECKS.map(() => false));

  async function capturePhoto() {
    try {
      const result = await cameraRef.current?.takePictureAsync({ quality: 0.82 });
      if (result?.uri) {
        setPhoto(result);
        setReviewStarted(false);
      }
    } catch {
      Alert.alert('Camera unavailable', 'We could not capture that image. Try choosing a photo instead.');
    }
  }

  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.82,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
      setReviewStarted(false);
    }
  }

  async function startReview() {
    const allowed = await consumeHandwrittenScan();
    if (allowed) {
      setReviewStarted(true);
      setChecks(REVIEW_CHECKS.map(() => false));
    }
  }

  function toggleCheck(index: number) {
    setChecks((current) => current.map((value, itemIndex) => (itemIndex === index ? !value : value)));
  }

  if (reviewStarted && photo) {
    const complete = checks.every(Boolean);
    return (
      <Screen>
        <PageTitle
          eyebrow="PAPER SCAN · PREVIEW REVIEW"
          title="Review your working"
          subtitle={`${data.subject} · Grade ${data.grade}`}
          right={<Tag tone={isPro ? 'green' : 'primary'}>{isPro ? 'PRO' : '1 FREE SCAN'}</Tag>}
        />
        <Card style={{ padding: 10, gap: 9 }}>
          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 220, borderRadius: 14 }} resizeMode="cover" />
          <View style={[uiStyles.row, uiStyles.gap8]}>
            <Feather name="search" size={15} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 13 }}>Preview feedback</Text>
          </View>
          <BodyText style={{ fontSize: 12 }}>
            This on-device preview helps you check the habits that protect working marks. It does not read handwriting or claim to be an official mark scheme.
          </BodyText>
        </Card>

        <View style={{ gap: 10 }}>
          {REVIEW_CHECKS.map((item, index) => {
            const checked = checks[index];
            return (
              <Pressable
                key={item.title}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                testID={`scan-check-${index}`}
                onPress={() => toggleCheck(index)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: checked ? colors.emerald : colors.border,
                  backgroundColor: checked ? colors.emeraldSoft : colors.card,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: checked ? colors.emerald : colors.muted,
                }}>
                  <Feather name={checked ? 'check' : 'circle'} size={16} color={checked ? colors.primaryForeground : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 13 }}>{item.title}</Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}>{item.detail}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Card style={{ backgroundColor: complete ? colors.emeraldSoft : colors.primarySoft, gap: 6 }}>
          <View style={[uiStyles.row, uiStyles.gap8]}>
            <Feather name={complete ? 'check-circle' : 'target'} size={17} color={complete ? colors.emerald : colors.primary} />
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 13 }}>
              {complete ? 'Ready to hand in' : `${checks.filter(Boolean).length} of ${REVIEW_CHECKS.length} checks complete`}
            </Text>
          </View>
          <BodyText style={{ fontSize: 12 }}>
            Build the habit of checking your method before you move on to the next question.
          </BodyText>
        </Card>
        <ActionButton title="Scan another page" icon="camera" onPress={() => { setPhoto(null); setReviewStarted(false); }} testID="scan-another" />
        <ActionButton title="Back to exam tools" icon="arrow-left" variant="quiet" onPress={() => router.back()} testID="scan-back" />
      </Screen>
    );
  }

  if (!photo) {
    if (!permission) {
      return (
        <Screen>
          <PageTitle eyebrow="PAPER SCAN" title="Get your work ready" subtitle="Loading camera access…" />
        </Screen>
      );
    }

    if (!permission.granted) {
      const permanentlyDenied = permission.status === 'denied' && !permission.canAskAgain;
      return (
        <Screen>
          <PageTitle eyebrow="PAPER SCAN" title="Scan your working" subtitle="Capture a clear page and review the details that protect method marks." />
          <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 26 }}>
            <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="camera" size={25} color={colors.primary} />
            </View>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' }}>
              Camera access helps you capture the page
            </Text>
            <BodyText style={{ textAlign: 'center', fontSize: 12 }}>
              You can also choose an existing photo from your library.
            </BodyText>
            <ActionButton
              title={permanentlyDenied ? 'Open device settings' : 'Allow camera access'}
              icon={permanentlyDenied ? 'settings' : 'camera'}
              onPress={() => {
                if (permanentlyDenied && Platform.OS !== 'web') {
                  void Linking.openSettings();
                } else {
                  void requestPermission();
                }
              }}
              testID="scan-camera-permission"
            />
            <ActionButton title="Choose from library" icon="image" variant="secondary" onPress={choosePhoto} testID="scan-library" />
          </Card>
          <ActionButton title="Back" icon="arrow-left" variant="quiet" onPress={() => router.back()} testID="scan-back-permission" />
        </Screen>
      );
    }

    return (
      <Screen>
        <PageTitle
          eyebrow="PAPER SCAN"
          title="Capture your working"
          subtitle="Keep the page flat, bright and fully inside the frame."
          right={<Tag tone={isPro ? 'green' : 'primary'}>{isPro ? 'UNLIMITED' : '1 THIS WEEK'}</Tag>}
        />
        <View style={{ overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
          <CameraView ref={cameraRef} style={{ height: 340 }} facing="back" />
          <View style={{ padding: 14, gap: 10 }}>
            <View style={[uiStyles.row, uiStyles.gap8]}>
              <Feather name="sun" size={15} color={colors.warning} />
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>Avoid shadows across the answer.</Text>
            </View>
            <ActionButton title="Take photo" icon="camera" onPress={capturePhoto} testID="scan-capture" />
          </View>
        </View>
        <ActionButton title="Choose from library" icon="image" variant="secondary" onPress={choosePhoto} testID="scan-library-camera" />
        <BodyText style={{ textAlign: 'center', fontSize: 11 }}>
          Preview mode: your photo stays on this device and is not uploaded.
        </BodyText>
        <ActionButton title="Back" icon="arrow-left" variant="quiet" onPress={() => router.back()} testID="scan-back-camera" />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageTitle eyebrow="PAPER SCAN" title="Ready to review" subtitle="Check the page before starting your feedback pass." />
      <Card style={{ padding: 10, gap: 12 }}>
        <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 300, borderRadius: 14 }} resizeMode="contain" />
        <View style={[uiStyles.row, uiStyles.gap8]}>
          <Feather name="check" size={15} color={colors.emerald} />
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Photo captured</Text>
        </View>
      </Card>
      <ActionButton title="Start preview review" icon="arrow-right" onPress={startReview} testID="scan-start-review" />
      <ActionButton title="Retake photo" icon="refresh-cw" variant="secondary" onPress={() => setPhoto(null)} testID="scan-retake" />
      <BodyText style={{ textAlign: 'center', fontSize: 11 }}>
        {isPro ? 'PRO preview review is available without a weekly scan limit.' : 'Free includes one preview scan each week.'}
      </BodyText>
    </Screen>
  );
}