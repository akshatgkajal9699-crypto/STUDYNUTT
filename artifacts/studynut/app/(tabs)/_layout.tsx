import React from 'react';
import { Platform, Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';

// IMPORTANT: iOS 26 uses NativeTabs for native tabs with liquid glass support.
// NativeTabs intentionally does NOT use custom design tokens — liquid glass
// is a system-level appearance provided by iOS and cannot be overridden.
// Custom brand colors are applied only on the ClassicTabLayout path (older iOS / Android / web).
function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="practice">
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} />
        <NativeTabs.Trigger.Label>Practice</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tutor">
        <NativeTabs.Trigger.Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
        <NativeTabs.Trigger.Label>NutAI</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exams">
        <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
        <NativeTabs.Trigger.Label>Exams</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          paddingTop: 8,
          ...(isWeb
            ? { height: 84, paddingBottom: 0 }
            : { paddingBottom: insets.bottom, height: 58 + insets.bottom }),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="book" tintColor={color} size={22} />
            ) : (
              <Feather name="book-open" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="tutor"
        options={{
          title: 'NutAI',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="sparkles" tintColor={color} size={22} />
            ) : (
              <Feather name="zap" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: 'Exams',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="clock" tintColor={color} size={22} />
            ) : (
              <Feather name="clock" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={20} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

const WEB_NAV_ITEMS: {
  name: 'index' | 'practice' | 'tutor' | 'exams' | 'profile';
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'practice', label: 'Practice', icon: 'book-open' },
  { name: 'tutor', label: 'NutAI', icon: 'zap' },
  { name: 'exams', label: 'Exams', icon: 'clock' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

function DesktopSidebar() {
  const colors = useColors();
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const activeName = pathname === '/' ? 'index' : pathname.split('/').filter(Boolean).at(-1);

  return (
    <View style={{
      width: wide ? 238 : 190,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingTop: 28,
      paddingBottom: 22,
      justifyContent: 'space-between',
    }}>
      <View style={{ gap: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 }}>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Feather name="book-open" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1.1 }}>STUDYNUT</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 10 }}>Study companion</Text>
          </View>
        </View>
        <View style={{ gap: 5 }}>
          <Text style={{
            color: colors.mutedForeground,
            fontFamily: 'Inter_700Bold',
            fontSize: 10,
            letterSpacing: 1.1,
            paddingHorizontal: 10,
            marginBottom: 4,
          }}>
            WORKSPACE
          </Text>
          {WEB_NAV_ITEMS.map((item) => {
            const active = activeName === item.name;
            return (
              <Pressable
                key={item.name}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => router.push(item.name === 'index' ? '/' : `/${item.name}`)}
                style={({ pressed }) => ({
                  minHeight: 43,
                  borderRadius: 13,
                  paddingHorizontal: 11,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 11,
                  backgroundColor: active ? colors.primarySoft : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Feather name={item.icon} size={17} color={active ? colors.primary : colors.mutedForeground} />
                <Text style={{
                  color: active ? colors.primary : colors.mutedForeground,
                  fontFamily: active ? 'Inter_700Bold' : 'Inter_500Medium',
                  fontSize: 13,
                }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: pathname === '/library' }}
            onPress={() => router.push('/library')}
            style={({ pressed }) => ({
              minHeight: 43,
              borderRadius: 13,
              paddingHorizontal: 11,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 11,
              backgroundColor: pathname === '/library' ? colors.primarySoft : 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Feather name="layers" size={17} color={pathname === '/library' ? colors.primary : colors.mutedForeground} />
            <Text style={{
              color: pathname === '/library' ? colors.primary : colors.mutedForeground,
              fontFamily: 'Inter_500Medium',
              fontSize: 13,
            }}>
              Learning library
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(isSignedIn ? '/profile' : '/sign-in')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 9,
            borderRadius: 13,
            backgroundColor: colors.surfaceRaised,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Feather name={isSignedIn ? 'user-check' : 'log-in'} size={16} color={colors.primary} />
          <Text style={{ flex: 1, color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
            {isSignedIn ? 'Account' : 'Sign in'}
          </Text>
          <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
        </Pressable>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, paddingHorizontal: 4 }}>
          Original study notes for Grades 6–10.
        </Text>
      </View>
    </View>
  );
}

function DesktopTabLayout() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      <DesktopSidebar />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  if (Platform.OS === 'web' && width >= 800) {
    return <DesktopTabLayout />;
  }
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
