/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#0F172A',
    tint: '#4F46E5',
    background: '#F8FAFC',
    foreground: '#0F172A',
    card: '#FFFFFF',
    cardForeground: '#0F172A',
    primary: '#4F46E5',
    primaryForeground: '#FFFFFF',
    secondary: '#EEF2FF',
    secondaryForeground: '#3730A3',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
    accent: '#DCFCE7',
    accentForeground: '#166534',
    destructive: '#DC2626',
    destructiveForeground: '#FFFFFF',
    border: '#E2E8F0',
    input: '#CBD5E1',
    surfaceRaised: '#F3F5FF',
    primarySoft: '#E8E9FF',
    emerald: '#10B981',
    emeraldSoft: '#D1FAE5',
    warning: '#F59E0B',
    warningSoft: '#FEF3C7',
    coral: '#F97366',
  },
  dark: {
    text: '#F8FAFC',
    tint: '#818CF8',
    background: '#090D16',
    foreground: '#F8FAFC',
    card: '#131B2E',
    cardForeground: '#F8FAFC',
    primary: '#818CF8',
    primaryForeground: '#FFFFFF',
    secondary: '#1E293B',
    secondaryForeground: '#C7D2FE',
    muted: '#1E293B',
    mutedForeground: '#94A3B8',
    accent: '#12352E',
    accentForeground: '#6EE7B7',
    destructive: '#F87171',
    destructiveForeground: '#FFFFFF',
    border: '#243149',
    input: '#334155',
    surfaceRaised: '#18233A',
    primarySoft: '#25294B',
    emerald: '#34D399',
    emeraldSoft: '#12352E',
    warning: '#FBBF24',
    warningSoft: '#3B2D13',
    coral: '#FB8B7D',
  },

  radius: 20,
};

export default colors;
