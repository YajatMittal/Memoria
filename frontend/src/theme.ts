/**
 * Design tokens. Memoria's users are often older adults living with memory
 * loss, so the system favours large type, high contrast (WCAG AA+), generous
 * spacing and big touch targets over density.
 */
export const colors = {
  background: '#F6F4FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEEAFA',
  primary: '#4B43B0',
  primaryPressed: '#3A3391',
  onPrimary: '#FFFFFF',
  text: '#1D1A2F',
  textMuted: '#4F4A66',
  border: '#D9D3EA',
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  success: '#1E7B4F',
  successSoft: '#E5F4EC',
  warning: '#8A5300',
  warningSoft: '#FFF4E0',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export const fontSize = { small: 15, body: 18, large: 20, heading: 24, title: 32 } as const;

/** Minimum height for anything tappable (larger than the 44pt platform minimum). */
export const touchTarget = 56;

export const shadow = {
  shadowColor: '#2A2350',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
} as const;
