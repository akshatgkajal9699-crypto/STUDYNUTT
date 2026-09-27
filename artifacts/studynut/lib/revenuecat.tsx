import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export const PRO_ENTITLEMENT_ID = 'studynut_pro';

export type PaidFeature =
  | 'paper-2'
  | 'paper-4'
  | 'timed-custom'
  | 'handwritten-scan'
  | 'ghost-mode';

export type PaywallReason =
  | PaidFeature
  | 'free-limit'
  | 'restore';

interface UsageData {
  scanWeek: string;
  scanCount: number;
  ghostMonth: string;
  ghostSessions: number;
}

interface SubscriptionContextValue {
  isPro: boolean;
  ready: boolean;
  loading: boolean;
  error: string | null;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  usage: UsageData;
  paywallReason: PaywallReason | null;
  showPaywall: (reason: PaywallReason) => void;
  dismissPaywall: () => void;
  purchase: (aPackage: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  manageSubscription: () => Promise<void>;
  canUseFeature: (feature: PaidFeature) => boolean;
  consumeHandwrittenScan: () => Promise<boolean>;
  consumeGhostSession: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);
const USAGE_KEY = '@studynut/subscription-usage-v1';

const emptyUsage = (): UsageData => ({
  scanWeek: weekKey(),
  scanCount: 0,
  ghostMonth: monthKey(),
  ghostSessions: 0,
});

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function weekKey(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1;
  return `${date.getFullYear()}-${Math.ceil(dayOfYear / 7)}`;
}

function currentUsage(value: Partial<UsageData> | null | undefined): UsageData {
  const next = { ...emptyUsage(), ...value };
  const currentWeek = weekKey();
  const currentMonth = monthKey();
  return {
    scanWeek: currentWeek,
    scanCount: next.scanWeek === currentWeek ? next.scanCount : 0,
    ghostMonth: currentMonth,
    ghostSessions: next.ghostMonth === currentMonth ? next.ghostSessions : 0,
  };
}

function reasonCopy(reason: PaywallReason | null) {
  switch (reason) {
    case 'paper-2':
      return {
        eyebrow: 'TIMED PAPER',
        title: 'Practise without the clock',
        body: 'Free members can build custom untimed sets. Upgrade to PRO for timed Cambridge-style papers and focused exam simulation.',
      };
    case 'paper-4':
      return {
        eyebrow: 'EXTENDED PAPER',
        title: 'Unlock the full exam simulator',
        body: 'PRO includes timed extended-response practice, so you can rehearse the real exam experience.',
      };
    case 'timed-custom':
      return {
        eyebrow: 'CUSTOM TIMER',
        title: 'Make your practice count',
        body: 'Timed custom papers are a PRO feature. Free members can still create unlimited untimed custom sets.',
      };
    case 'handwritten-scan':
      return {
        eyebrow: 'HANDWRITTEN SCAN',
        title: 'Scan more of your work',
        body: 'Free includes one handwritten-paper scan each week. PRO removes the weekly limit.',
      };
    case 'ghost-mode':
      return {
        eyebrow: 'GHOST MODE',
        title: 'Keep your focus going',
        body: 'Free includes one Ghost Mode session each month, capped at 60 seconds. PRO removes both limits.',
      };
    case 'free-limit':
      return {
        eyebrow: 'FREE PLAN LIMIT',
        title: 'You have reached the free limit',
        body: 'Upgrade to PRO for unlimited access to STUDYNUT’s focused study tools.',
      };
    case 'restore':
      return {
        eyebrow: 'RESTORE PURCHASES',
        title: 'Bring PRO back',
        body: 'Restore an active subscription from your App Store or Google Play account.',
      };
    default:
      return {
        eyebrow: 'STUDYNUT PRO',
        title: 'Study with fewer limits',
        body: 'Unlock timed papers, unlimited scans, and longer Ghost Mode sessions.',
      };
  }
}

function packageLabel(aPackage: PurchasesPackage) {
  const id = aPackage.identifier.toLowerCase();
  if (id.includes('six') || id.includes('6month')) return '6 months';
  if (id.includes('annual') || id.includes('year')) return 'Yearly';
  if (id.includes('monthly') || id.includes('month')) return 'Monthly';
  return aPackage.product.title;
}

function packageDetail(aPackage: PurchasesPackage) {
  const intro = aPackage.product.introPrice;
  if (intro && intro.priceString !== aPackage.product.priceString) {
    return `${intro.priceString} intro price · then ${aPackage.product.priceString}`;
  }
  return aPackage.product.priceString;
}

export function SubscriptionProvider({
  children,
  appUserId,
}: PropsWithChildren<{ appUserId?: string }>) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [usage, setUsage] = useState<UsageData>(emptyUsage);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywallReason, setPaywallReason] = useState<PaywallReason | null>(null);

  const usageKey = `${USAGE_KEY}:${appUserId ?? 'guest'}`;
  const apiKey =
    Platform.OS === 'web'
      ? undefined
      : Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : Platform.OS === 'android'
        ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ??
          process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

  const updateCustomerInfo = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(usageKey)
      .then((stored) => {
        if (!mounted) return;
        setUsage(currentUsage(stored ? (JSON.parse(stored) as Partial<UsageData>) : null));
      })
      .catch((storageError: unknown) => {
        console.warn('Could not restore STUDYNUT subscription usage.', storageError);
      });
    return () => {
      mounted = false;
    };
  }, [usageKey]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(usageKey, JSON.stringify(usage)).catch(
      (storageError: unknown) =>
        console.warn('Could not save STUDYNUT subscription usage.', storageError),
    );
  }, [ready, usage, usageKey]);

  useEffect(() => {
    let mounted = true;
    const loadRevenueCat = async () => {
      if (!apiKey) {
        if (mounted) {
          setError('RevenueCat is not configured yet. The free plan is still available.');
          setReady(true);
        }
        return;
      }

      try {
        const configured = await Purchases.isConfigured();
        if (!configured) {
          Purchases.configure({ apiKey });
        }
        if (appUserId) {
          await Purchases.logIn(appUserId);
        } else if (configured) {
          await Purchases.logOut();
        }
        const [info, availableOfferings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        if (!mounted) return;
        setCustomerInfo(info);
        setOfferings(availableOfferings.current);
      } catch (revenueCatError: unknown) {
        console.warn('Could not connect to RevenueCat.', revenueCatError);
        if (mounted) {
          setError('Subscriptions are temporarily unavailable. You can keep using the free plan.');
        }
      } finally {
        if (mounted) setReady(true);
      }
    };

    loadRevenueCat();
    if (apiKey) Purchases.addCustomerInfoUpdateListener(updateCustomerInfo);
    return () => {
      mounted = false;
      if (apiKey) Purchases.removeCustomerInfoUpdateListener(updateCustomerInfo);
    };
  }, [apiKey, appUserId, updateCustomerInfo]);

  const isPro = Boolean(customerInfo?.entitlements.active[PRO_ENTITLEMENT_ID]);

  const showPaywall = useCallback((reason: PaywallReason) => {
    setPaywallReason(reason);
  }, []);

  const dismissPaywall = useCallback(() => {
    setPaywallReason(null);
  }, []);

  const purchase = useCallback(async (aPackage: PurchasesPackage) => {
    setLoading(true);
    setError(null);
    try {
      const result = await Purchases.purchasePackage(aPackage);
      setCustomerInfo(result.customerInfo);
      setPaywallReason(null);
    } catch (purchaseError: unknown) {
      const code = String((purchaseError as { code?: unknown })?.code ?? '').toLowerCase();
      if (!code.includes('cancel')) {
        setError('We could not complete that purchase. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      if (info.entitlements.active[PRO_ENTITLEMENT_ID]) {
        setPaywallReason(null);
      } else {
        setError('No active STUDYNUT PRO subscription was found.');
      }
    } catch (restoreError: unknown) {
      console.warn('Could not restore STUDYNUT purchases.', restoreError);
      setError('Restore did not complete. Check your store account and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const manageSubscription = useCallback(async () => {
    const managementUrl = customerInfo?.managementURL;
    if (managementUrl) await Linking.openURL(managementUrl);
    else setError('Subscription management is available from your app store account.');
  }, [customerInfo?.managementURL]);

  const canUseFeature = useCallback(
    (feature: PaidFeature) => {
      if (isPro) return true;
      if (feature === 'handwritten-scan') return usage.scanCount < 1;
      if (feature === 'ghost-mode') return usage.ghostSessions < 1;
      return false;
    },
    [isPro, usage.ghostSessions, usage.scanCount],
  );

  const consumeHandwrittenScan = useCallback(async () => {
    if (isPro) return true;
    if (!canUseFeature('handwritten-scan')) {
      showPaywall('handwritten-scan');
      return false;
    }
    setUsage((current) => currentUsage({
      ...current,
      scanCount: current.scanCount + 1,
    }));
    return true;
  }, [canUseFeature, isPro, showPaywall]);

  const consumeGhostSession = useCallback(async () => {
    if (isPro) return true;
    if (!canUseFeature('ghost-mode')) {
      showPaywall('ghost-mode');
      return false;
    }
    setUsage((current) => currentUsage({
      ...current,
      ghostSessions: current.ghostSessions + 1,
    }));
    return true;
  }, [canUseFeature, isPro, showPaywall]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      isPro,
      ready,
      loading,
      error,
      offerings,
      customerInfo,
      usage,
      paywallReason,
      showPaywall,
      dismissPaywall,
      purchase,
      restorePurchases,
      manageSubscription,
      canUseFeature,
      consumeHandwrittenScan,
      consumeGhostSession,
    }),
    [
      canUseFeature,
      consumeGhostSession,
      consumeHandwrittenScan,
      customerInfo,
      dismissPaywall,
      error,
      isPro,
      loading,
      manageSubscription,
      offerings,
      paywallReason,
      purchase,
      ready,
      restorePurchases,
      showPaywall,
      usage,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <SubscriptionPaywall />
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider.');
  return context;
}

function SubscriptionPaywall() {
  const colors = useColors();
  const {
    paywallReason,
    dismissPaywall,
    offerings,
    purchase,
    restorePurchases,
    manageSubscription,
    loading,
    error,
    isPro,
  } = useSubscription();
  const copy = reasonCopy(paywallReason);
  const packages = offerings?.availablePackages ?? [];

  return (
    <Modal
      visible={Boolean(paywallReason)}
      transparent
      animationType="slide"
      onRequestClose={dismissPaywall}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close subscription offer"
            testID="close-paywall"
            onPress={dismissPaywall}
            style={styles.closeButton}
          >
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
          <View style={styles.heroIcon}>
            <Feather name="zap" size={22} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{copy.eyebrow}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{isPro ? 'STUDYNUT PRO is active' : copy.title}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{copy.body}</Text>

          {!isPro && packages.length > 0 ? (
            <View style={styles.packageList}>
              {packages.map((aPackage) => (
                <Pressable
                  key={aPackage.identifier}
                  accessibilityRole="button"
                  testID={`purchase-${aPackage.identifier}`}
                  onPress={() => purchase(aPackage)}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.packageRow,
                    { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed || loading ? 0.72 : 1 },
                  ]}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.packageName, { color: colors.foreground }]}>{packageLabel(aPackage)}</Text>
                    <Text style={[styles.packageDescription, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {aPackage.product.title}
                    </Text>
                  </View>
                  <Text style={[styles.packagePrice, { color: colors.primary }]}>{packageDetail(aPackage)}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyOffer, { backgroundColor: colors.muted }]}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={[styles.packageDescription, { color: colors.mutedForeground }]}>
                {offerings ? 'Plans are not available right now.' : 'Loading plans from RevenueCat…'}
              </Text>
            </View>
          )}

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            testID="restore-purchases"
            onPress={restorePurchases}
            disabled={loading}
            style={styles.restoreButton}
          >
            <Text style={[styles.restoreText, { color: colors.primary }]}>Restore purchases</Text>
          </Pressable>
          {isPro ? (
            <Pressable
              accessibilityRole="button"
              testID="manage-subscription"
              onPress={manageSubscription}
              style={styles.restoreButton}
            >
              <Text style={[styles.restoreText, { color: colors.primary }]}>Manage subscription</Text>
            </Pressable>
          ) : null}
          <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
            Payment is handled securely by your app store. Plans and prices may vary by country.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    gap: 11,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#CBD5E1',
    marginBottom: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#335CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 25,
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  packageList: {
    gap: 8,
    marginTop: 3,
  },
  packageRow: {
    minHeight: 62,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packageName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  packageDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  packagePrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  emptyOffer: {
    minHeight: 58,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  error: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  restoreButton: {
    alignSelf: 'center',
    padding: 4,
  },
  restoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  footnote: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
  },
});