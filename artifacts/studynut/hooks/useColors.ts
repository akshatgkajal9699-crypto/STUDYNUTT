import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';
import { ThemePreferenceContext } from '@/context/StudyProvider';
import { useContext } from 'react';

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * Falls back to the light palette when no dark key is defined in
 * constants/colors.ts (the scaffold ships light-only by default).
 * When a sibling web artifact's dark tokens are synced into a `dark`
 * key, this hook will automatically switch palettes based on the
 * device's appearance setting.
 */
export function useColors() {
  const scheme = useColorScheme();
  const preference = useContext(ThemePreferenceContext);
  const preferredMode = preference?.mode ?? 'auto';
  const resolvedScheme =
    preferredMode === 'auto' ? scheme : preferredMode;
  const palette = resolvedScheme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
