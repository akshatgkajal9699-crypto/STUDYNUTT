import React, { PropsWithChildren } from 'react';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { BodyText, Card, Screen, Tag, uiStyles } from '@/components/studynut-ui';
import { useColors } from '@/hooks/useColors';

export function AuthFrame({
  title,
  subtitle,
  children,
  footer,
}: PropsWithChildren<{ title: string; subtitle: string; footer: React.ReactNode }>) {
  const colors = useColors();
  return (
    <Screen contentStyle={{ alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 520, gap: 18 }}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 22 }}>N</Text>
          </View>
          <Text style={{
            color: colors.foreground,
            fontFamily: 'Inter_700Bold',
            fontSize: 15,
            letterSpacing: 1.3,
          }}>
            STUDYNUT
          </Text>
          <Tag tone="green">Guest access stays available</Tag>
        </View>
        <Card style={{ gap: 16, padding: 22 }}>
          <View style={{ gap: 5 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 25 }}>
              {title}
            </Text>
            <BodyText>{subtitle}</BodyText>
          </View>
          {children}
        </Card>
        <View style={[uiStyles.row, { justifyContent: 'center', gap: 4, flexWrap: 'wrap' }]}>
          {footer}
        </View>
        <View style={{ alignItems: 'center' }}>
          <Link href="/">
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>
              Continue as guest
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

export function FieldLabel({ children }: PropsWithChildren) {
  const colors = useColors();
  return (
    <Text style={{
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
    }}>
      {children}
    </Text>
  );
}