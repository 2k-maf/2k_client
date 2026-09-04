import { createTheme, alpha, PaletteMode, Shadows } from '@mui/material/styles';
import { brandColors, brandFonts } from './brand';

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    highlighted: true;
  }
}
declare module '@mui/material/styles/createPalette' {
  interface ColorRange {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  }

  interface PaletteColor extends ColorRange {}

  interface Palette {
    baseShadow: string;
  }
}

const defaultTheme = createTheme();

const customShadows: Shadows = [...defaultTheme.shadows];

export const brand = {
  50: 'hsl(4, 100%, 96%)',
  100: 'hsl(4, 100%, 90%)',
  200: 'hsl(4, 100%, 80%)',
  300: 'hsl(6, 100%, 68%)',
  400: 'hsl(4, 96%, 55%)',
  500: 'hsl(4, 89%, 45%)',
  600: 'hsl(4, 87%, 37%)',
  700: 'hsl(4, 87%, 28%)',
  800: 'hsl(4, 87%, 20%)',
  900: 'hsl(4, 87%, 13%)',
};

export const gray = {
  50: 'hsl(225, 25%, 96%)',
  100: 'hsl(226, 30%, 89%)',
  200: 'hsl(226, 30%, 78%)',
  300: 'hsl(226, 26%, 63%)',
  400: 'hsl(226, 16%, 49%)',
  500: 'hsl(226, 22%, 37%)',
  600: 'hsl(226, 26%, 27%)',
  700: 'hsl(228, 33%, 16%)',
  800: 'hsl(230, 39%, 12%)',
  900: 'hsl(229, 43%, 6%)',
};

export const green = {
  50: 'hsl(154, 76%, 95%)',
  100: 'hsl(154, 74%, 89%)',
  200: 'hsl(154, 72%, 80%)',
  300: 'hsl(154, 76%, 75%)',
  400: 'hsl(154, 64%, 59%)',
  500: 'hsl(154, 59%, 45%)',
  600: 'hsl(154, 65%, 34%)',
  700: 'hsl(154, 66%, 25%)',
  800: 'hsl(154, 66%, 17%)',
  900: 'hsl(154, 67%, 9%)',
};

export const orange = {
  50: 'hsl(18, 100%, 96%)',
  100: 'hsl(18, 100%, 90%)',
  200: 'hsl(18, 100%, 82%)',
  300: 'hsl(18, 100%, 68%)',
  400: 'hsl(18, 100%, 61%)',
  500: 'hsl(18, 86%, 53%)',
  600: 'hsl(18, 83%, 43%)',
  700: 'hsl(18, 83%, 33%)',
  800: 'hsl(18, 84%, 23%)',
  900: 'hsl(18, 85%, 14%)',
};

export const red = {
  50: 'hsl(0, 100%, 97%)',
  100: 'hsl(0, 100%, 92%)',
  200: 'hsl(0, 100%, 85%)',
  300: 'hsl(0, 100%, 77%)',
  400: 'hsl(0, 89%, 66%)',
  500: 'hsl(0, 71%, 55%)',
  600: 'hsl(0, 62%, 44%)',
  700: 'hsl(0, 63%, 33%)',
  800: 'hsl(0, 65%, 22%)',
  900: 'hsl(0, 65%, 13%)',
};

export const getDesignTokens = (mode: PaletteMode) => {
  customShadows[1] =
    mode === 'dark'
      ? 'hsla(220, 30%, 5%, 0.7) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.8) 0px 8px 16px -5px'
      : 'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px';

  return {
    palette: {
      mode,
      primary: {
        light: brand[200],
        main: brand[400],
        dark: brand[700],
        contrastText: brand[50],
        ...(mode === 'dark' && {
          contrastText: brand[50],
          light: brand[300],
          main: brand[400],
          dark: brand[700],
        }),
      },
      info: {
        light: brand[100],
        main: brand[300],
        dark: brand[600],
        contrastText: gray[50],
        ...(mode === 'dark' && {
          contrastText: brand[300],
          light: brand[500],
          main: brand[700],
          dark: brand[900],
        }),
      },
      warning: {
        light: orange[300],
        main: orange[400],
        dark: orange[800],
        ...(mode === 'dark' && {
          light: orange[400],
          main: orange[500],
          dark: orange[700],
        }),
      },
      error: {
        light: red[300],
        main: red[400],
        dark: red[800],
        ...(mode === 'dark' && {
          light: red[400],
          main: red[500],
          dark: red[700],
        }),
      },
      success: {
        light: green[300],
        main: green[400],
        dark: green[800],
        ...(mode === 'dark' && {
          light: green[400],
          main: green[500],
          dark: green[700],
        }),
      },
      grey: {
        ...gray,
      },
      divider: mode === 'dark' ? brandColors.border : alpha(gray[300], 0.4),
      background: {
        default: 'hsl(0, 0%, 99%)',
        paper: 'hsl(220, 35%, 97%)',
        ...(mode === 'dark' && { default: brandColors.bg, paper: brandColors.panel }),
      },
      text: {
        primary: gray[800],
        secondary: gray[600],
        warning: orange[400],
        ...(mode === 'dark' && { primary: brandColors.text, secondary: gray[300] }),
      },
      action: {
        hover: alpha(gray[200], 0.2),
        selected: `${alpha(gray[200], 0.3)}`,
        ...(mode === 'dark' && {
          hover: alpha(gray[600], 0.2),
          selected: alpha(gray[600], 0.3),
        }),
      },
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      h1: {
      fontFamily: brandFonts.display,
        fontSize: defaultTheme.typography.pxToRem(48),
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: -0.5,
      },
      h2: {
      fontFamily: brandFonts.display,
        fontSize: defaultTheme.typography.pxToRem(36),
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h3: {
      fontFamily: brandFonts.display,
        fontSize: defaultTheme.typography.pxToRem(30),
        lineHeight: 1.2,
      },
      h4: {
      fontFamily: brandFonts.display,
        fontSize: defaultTheme.typography.pxToRem(24),
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h5: {
        fontSize: defaultTheme.typography.pxToRem(20),
        fontWeight: 600,
      },
      h6: {
        fontSize: defaultTheme.typography.pxToRem(18),
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: defaultTheme.typography.pxToRem(18),
      },
      subtitle2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        fontWeight: 500,
      },
      body1: {
        fontSize: defaultTheme.typography.pxToRem(14),
      },
      body2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        fontWeight: 400,
      },
      caption: {
        fontSize: defaultTheme.typography.pxToRem(12),
        fontWeight: 400,
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: customShadows,
  };
};

export const colorSchemes = {
  light: {
    palette: {
      primary: {
        light: brand[200],
        main: brand[400],
        dark: brand[700],
        contrastText: brand[50],
      },
      info: {
        light: brand[100],
        main: brand[300],
        dark: brand[600],
        contrastText: gray[50],
      },
      warning: {
        light: orange[300],
        main: orange[400],
        dark: orange[800],
      },
      error: {
        light: red[300],
        main: red[400],
        dark: red[800],
      },
      success: {
        light: green[300],
        main: green[400],
        dark: green[800],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[300], 0.4),
      background: {
        default: 'hsl(0, 0%, 99%)',
        paper: 'hsl(220, 35%, 97%)',
      },
      text: {
        primary: gray[800],
        secondary: gray[600],
        warning: orange[400],
      },
      action: {
        hover: alpha(gray[200], 0.2),
        selected: `${alpha(gray[200], 0.3)}`,
      },
      baseShadow:
        'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px',
    },
  },
  dark: {
    palette: {
      primary: {
        contrastText: brand[50],
        light: brand[300],
        main: brand[400],
        dark: brand[700],
      },
      info: {
        contrastText: brand[300],
        light: brand[500],
        main: brand[700],
        dark: brand[900],
      },
      warning: {
        light: orange[400],
        main: orange[500],
        dark: orange[700],
      },
      error: {
        light: red[400],
        main: red[500],
        dark: red[700],
      },
      success: {
        light: green[400],
        main: green[500],
        dark: green[700],
      },
      grey: {
        ...gray,
      },
      divider: brandColors.border,
      background: {
        default: brandColors.bg,
        paper: brandColors.panel,
      },
      text: {
        primary: brandColors.text,
        secondary: gray[300],
      },
      action: {
        hover: alpha(gray[600], 0.2),
        selected: alpha(gray[600], 0.3),
      },
      baseShadow:
        'hsla(220, 30%, 5%, 0.7) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.8) 0px 8px 16px -5px',
    },
  },
};

export const typography = {
  fontFamily: "'Inter', sans-serif",
  h1: {
      fontFamily: brandFonts.display,
    fontSize: defaultTheme.typography.pxToRem(48),
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: -0.5,
  },
  h2: {
      fontFamily: brandFonts.display,
    fontSize: defaultTheme.typography.pxToRem(36),
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h3: {
      fontFamily: brandFonts.display,
    fontSize: defaultTheme.typography.pxToRem(30),
    lineHeight: 1.2,
  },
  h4: {
      fontFamily: brandFonts.display,
    fontSize: defaultTheme.typography.pxToRem(24),
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h5: {
    fontSize: defaultTheme.typography.pxToRem(20),
    fontWeight: 600,
  },
  h6: {
    fontSize: defaultTheme.typography.pxToRem(18),
    fontWeight: 600,
  },
  subtitle1: {
    fontSize: defaultTheme.typography.pxToRem(18),
  },
  subtitle2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 500,
  },
  body1: {
    fontSize: defaultTheme.typography.pxToRem(14),
  },
  body2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 400,
  },
  caption: {
    fontSize: defaultTheme.typography.pxToRem(12),
    fontWeight: 400,
  },
};

export const shape = {
  borderRadius: 8,
};

// @ts-ignore
const defaultShadows: Shadows = [
  'none',
  'var(--template-palette-baseShadow)',
  ...defaultTheme.shadows.slice(2),
];
export const shadows = defaultShadows;
