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
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export const PRO_ENTITLEMENT_ID = 'studynut_pro';

export type PaidFeature =
  | 'paper-2'
  | 'paper-4'
  | 'timed-custom'
  | 'handwritten-scan'
  | 'command-term'
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
    case 'command-term':
      return {
        eyebrow: 'COMMAND TERM CARDS',
        title: 'See how marks are awarded',
        body: 'Free members can review the basic command-term definitions. PRO unlocks the contextual rubric cards and common mark-loss traps.',
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

type PlanKind = 'monthly' | 'six-month' | 'yearly';

function packagePlanKind(aPackage: PurchasesPackage): PlanKind | null {
  const id = aPackage.identifier.toLowerCase();
  const period = aPackage.product.subscriptionPeriod?.toUpperCase();
  if (
    aPackage.packageType === 'SIX_MONTH' ||
    period === 'P6M' ||
    id.includes('six_month') ||
    id.includes('six-month') ||
    id.includes('6month')
  ) {
    return 'six-month';
  }
  if (
    aPackage.packageType === 'ANNUAL' ||
    period === 'P1Y' ||
    id.includes('annual') ||
    id.includes('year')
  ) {
    return 'yearly';
  }
  if (
    aPackage.packageType === 'MONTHLY' ||
    period === 'P1M' ||
    id.includes('monthly')
  ) {
    return 'monthly';
  }
  return null;
}

function planLabel(kind: PlanKind) {
  if (kind === 'six-month') return '6 months';
  if (kind === 'yearly') return 'Yearly';
  return 'Monthly';
}

function planPeriod(kind: PlanKind) {
  if (kind === 'six-month') return '6 months';
  if (kind === 'yearly') return 'year';
  return 'month';
}

function freeTrialLabel(aPackage: PurchasesPackage, kind: PlanKind) {
  const intro = aPackage.product.introPrice;
  if (!intro || intro.price !== 0 || kind === 'monthly') return null;
  const unit = intro.periodUnit.toLowerCase();
  if (unit === 'day' && intro.periodNumberOfUnits === 7) return '7-day free trial';
  const count = intro.periodNumberOfUnits;
  return `${count} ${unit}${count === 1 ? '' : 's'} free trial`;
}

function monthlySavingsLabel(
  aPackage: PurchasesPackage,
  kind: PlanKind,
  monthlyPackage: PurchasesPackage | undefined,
) {
  if (kind === 'monthly' || !monthlyPackage || monthlyPackage.product.price <= 0) {
    return null;
  }
  const months = kind === 'six-month' ? 6 : 12;
  const discount = Math.round(
    (1 - aPackage.product.price / months / monthlyPackage.product.price) * 100,
  );
  return discount > 0 ? `${discount}% less per month` : null;
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
  const useTestStore =
    __DEV__ || process.env.EXPO_PUBLIC_REVENUECAT_TEST_MODE === 'true';
  const apiKey = useTestStore
    ? process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY
    : Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : Platform.OS === 'android'
        ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
        : undefined;

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
      if (feature === 'command-term') return false;
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
  const { height } = useWindowDimensions();
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
    ready,
  } = useSubscription();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const copy = reasonCopy(paywallReason);
  const packages = (offerings?.availablePackages ?? [])
    .map((aPackage) => ({ aPackage, kind: packagePlanKind(aPackage) }))
    .filter(
      (plan): plan is { aPackage: PurchasesPackage; kind: PlanKind } =>
        plan.kind !== null,
    )
    .sort((left, right) => {
      const order: Record<PlanKind, number> = {
        yearly: 0,
        'six-month': 1,
        monthly: 2,
      };
      return order[left.kind] - order[right.kind];
    });
  const monthlyPackage = packages.find((plan) => plan.kind === 'monthly')?.aPackage;
  const selectedPlan =
    packages.find((plan) => plan.aPackage.identifier === selectedPackageId) ??
    packages.find((plan) => plan.kind === 'yearly') ??
    packages[0];
  const trialLabel = selectedPlan
    ? freeTrialLabel(selectedPlan.aPackage, selectedPlan.kind)
    : null;
  const closePaywall = () => {
    setSelectedPackageId(null);
    dismissPaywall();
  };
  const purchaseSelectedPlan = () => {
    if (selectedPlan) void purchase(selectedPlan.aPackage);
  };

  return (
    <Modal
      visible={Boolean(paywallReason)}
      transparent
      animationType="slide"
      onRequestClose={closePaywall}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              maxHeight: height * 0.94,
            },
          ]}
        >
          <View style={styles.sheetTopRow}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close subscription offer"
            testID="close-paywall"
            onPress={closePaywall}
            style={styles.closeButton}
          >
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
          >
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather name="zap" size={22} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>
              {copy.eyebrow}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {isPro ? 'STUDYNUT PRO is active' : copy.title}
            </Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              {isPro
                ? 'Your active subscription is linked to your store account.'
                : copy.body}
            </Text>

            <View
              style={[
                styles.benefitPanel,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.benefitHeading, { color: colors.foreground }]}>
                PRO includes
              </Text>
              {[
                {
                  icon: 'clock' as const,
                  title: 'Timed Paper 2 & 4 practice',
                  detail: 'Cambridge-style sample papers, not official past papers.',
                },
                {
                  icon: 'camera' as const,
                  title: 'More scan-preview sessions',
                  detail: 'The current scan flow is a local preview, not AI grading.',
                },
                {
                  icon: 'file-text' as const,
                  title: 'Expanded command-term rubrics',
                  detail: 'Context, examples, and common mark-loss traps.',
                },
                {
                  icon: 'mic' as const,
                  title: 'Longer Ghost Mode practice',
                  detail: 'Up to five minutes; prompts are scripted, not live voice AI.',
                },
              ].map((benefit) => (
                <View key={benefit.title} style={styles.benefitRow}>
                  <View
                    style={[
                      styles.benefitIcon,
                      { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Feather
                      name={benefit.icon}
                      size={15}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.benefitCopy}>
                    <Text
                      style={[
                        styles.benefitTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      {benefit.title}
                    </Text>
                    <Text
                      style={[
                        styles.benefitDetail,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {benefit.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {!isPro && packages.length > 0 ? (
              <View style={styles.packageList}>
                <Text style={[styles.benefitHeading, { color: colors.foreground }]}>
                  Choose your plan
                </Text>
                {packages.map(({ aPackage, kind }) => {
                  const isSelected =
                    selectedPlan?.aPackage.identifier === aPackage.identifier;
                  const planTrial = freeTrialLabel(aPackage, kind);
                  const savings = monthlySavingsLabel(
                    aPackage,
                    kind,
                    monthlyPackage,
                  );
                  const badge =
                    planTrial ??
                    (kind === 'yearly' && savings ? 'Best value' : null);
                  const perMonth =
                    kind === 'monthly'
                      ? null
                      : aPackage.product.pricePerMonthString;
                  return (
                    <Pressable
                      key={aPackage.identifier}
                      accessibilityRole="radio"
                      accessibilityLabel={`${planLabel(kind)}, ${aPackage.product.priceString} per ${planPeriod(kind)}`}
                      accessibilityState={{
                        selected: isSelected,
                        disabled: loading,
                      }}
                      testID={`select-plan-${kind}`}
                      onPress={() => setSelectedPackageId(aPackage.identifier)}
                      disabled={loading}
                      style={({ pressed }) => [
                        styles.packageRow,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected
                            ? colors.primarySoft
                            : colors.background,
                          opacity: pressed || loading ? 0.78 : 1,
                        },
                      ]}
                    >
                      <View style={styles.planCopy}>
                        <View style={styles.planTitleRow}>
                          <Text
                            style={[
                              styles.packageName,
                              { color: colors.foreground },
                            ]}
                          >
                            {planLabel(kind)}
                          </Text>
                          {badge ? (
                            <View
                              style={[
                                styles.planBadge,
                                { backgroundColor: colors.primary },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.planBadgeText,
                                  { color: colors.primaryForeground },
                                ]}
                              >
                                {badge}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            styles.planPrice,
                            { color: colors.foreground },
                          ]}
                        >
                          {aPackage.product.priceString}
                          <Text
                            style={[
                              styles.packageDescription,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {' '}
                            / {planPeriod(kind)}
                          </Text>
                        </Text>
                        {perMonth ? (
                          <Text
                            style={[
                              styles.packageDescription,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {perMonth} per month
                            {savings ? ` · ${savings}` : ''}
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSelected
                              ? colors.primary
                              : colors.input,
                          },
                        ]}
                      >
                        {isSelected ? (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {!isPro && packages.length === 0 ? (
              <View style={[styles.emptyOffer, { backgroundColor: colors.muted }]}>
                {ready ? (
                  <Feather
                    name="alert-circle"
                    size={16}
                    color={colors.mutedForeground}
                  />
                ) : (
                  <ActivityIndicator color={colors.primary} size="small" />
                )}
                <Text
                  style={[
                    styles.packageDescription,
                    { color: colors.mutedForeground, flex: 1 },
                  ]}
                >
                  {ready
                    ? 'Subscription plans are unavailable on this build.'
                    : 'Loading plans from RevenueCat…'}
                </Text>
              </View>
            ) : null}

            {trialLabel && selectedPlan ? (
              <Text style={[styles.trialNote, { color: colors.accentForeground }]}>
                {trialLabel} applies to this plan when you are eligible.
              </Text>
            ) : null}

            {!isPro ? (
              <Pressable
                accessibilityRole="button"
                testID="purchase-selected-plan"
                onPress={purchaseSelectedPlan}
                disabled={loading || !selectedPlan}
                style={({ pressed }) => [
                  styles.purchaseButton,
                  {
                    backgroundColor: colors.primary,
                    opacity:
                      loading || !selectedPlan ? 0.5 : pressed ? 0.82 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.purchaseButtonText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      {selectedPlan
                        ? trialLabel
                          ? `Start ${trialLabel}`
                          : selectedPlan.kind === 'monthly'
                            ? 'Upgrade now'
                            : `Continue with ${planLabel(selectedPlan.kind)}`
                        : 'Plans unavailable'}
                    </Text>
                    {selectedPlan ? (
                      <Feather
                        name="arrow-right"
                        size={17}
                        color={colors.primaryForeground}
                      />
                    ) : null}
                  </>
                )}
              </Pressable>
            ) : null}

            {error ? (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {error}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              testID="restore-purchases"
              onPress={restorePurchases}
              disabled={loading}
              style={styles.restoreButton}
            >
              <Text style={[styles.restoreText, { color: colors.primary }]}>
                Restore purchases
              </Text>
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
              Price and renewal terms are provided by your store. Free trials
              appear only when the store offer is available to your account.
              Scans and Ghost Mode are currently previews; they are not AI-graded
              or live voice sessions.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    borderTopWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetTopRow: {
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
    gap: 11,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 99,
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 14,
    padding: 6,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
    marginTop: 2,
  },
  packageRow: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planCopy: {
    flex: 1,
    gap: 4,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  planBadge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  packageName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  planPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  packageDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  radioOuter: {
    width: 21,
    height: 21,
    borderRadius: 99,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 99,
  },
  benefitPanel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 13,
  },
  benefitHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  benefitDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  purchaseButton: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 2,
  },
  purchaseButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  trialNote: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  emptyOffer: {
    minHeight: 58,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 14,
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