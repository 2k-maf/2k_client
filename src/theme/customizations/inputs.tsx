import * as React from 'react';
import { alpha, Theme, Components } from '@mui/material/styles';
import { outlinedInputClasses } from '@mui/material/OutlinedInput';
import { svgIconClasses } from '@mui/material/SvgIcon';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import { toggleButtonClasses } from '@mui/material/ToggleButton';
import CheckBoxOutlineBlankRoundedIcon from '@mui/icons-material/CheckBoxOutlineBlankRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { gray, brand } from '../themePrimitives';
import { brandColors } from '../brand';

export const inputsCustomizations: Components<Theme> = {
  MuiButtonBase: {
    defaultProps: {
      disableTouchRipple: true,
      disableRipple: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        boxSizing: 'border-box',
        transition: 'all 100ms ease-in',
        '&:focus-visible': {
          outline: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          outlineOffset: '2px',
        },
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        boxShadow: 'none',
        borderRadius: (theme.vars || theme).shape.borderRadius,
        textTransform: 'none',
        variants: [
          {
            props: {
              size: 'small',
            },
            style: {
              height: '2.25rem',
              padding: '8px 12px',
            },
          },
          {
            props: {
              size: 'medium',
            },
            style: {
              height: '2.5rem', // 40px
            },
          },
          {
            props: {
              color: 'primary',
              variant: 'contained',
            },
            // Головна CTA бренду Dva Kol'ory — суцільний червоний, без градієнта.
            style: {
              color: '#fff',
              backgroundColor: brandColors.accent,
              backgroundImage: 'none',
              boxShadow: 'none',
              border: 'none',
              fontWeight: 700,
              '&:hover': {
                backgroundColor: brandColors.accentHover,
                boxShadow: 'none',
              },
              '&:active': {
                backgroundColor: brandColors.accent,
              },
            },
          },
          {
            props: {
              color: 'secondary',
              variant: 'contained',
            },
            style: {
              color: 'white',
              backgroundColor: brand[300],
              backgroundImage: `linear-gradient(to bottom, ${alpha(brand[400], 0.8)}, ${brand[500]})`,
              boxShadow: `inset 0 2px 0 ${alpha(brand[200], 0.2)}, inset 0 -2px 0 ${alpha(brand[700], 0.4)}`,
              border: `1px solid ${brand[500]}`,
              '&:hover': {
                backgroundColor: brand[700],
                boxShadow: 'none',
              },
              '&:active': {
                backgroundColor: brand[700],
                backgroundImage: 'none',
              },
            },
          },
          {
            props: {
              variant: 'outlined',
            },
            style: {
              color: (theme.vars || theme).palette.text.primary,
              border: '1px solid',
              borderColor: gray[200],
              backgroundColor: alpha(gray[50], 0.3),
              '&:hover': {
                backgroundColor: gray[100],
                borderColor: gray[300],
              },
              '&:active': {
                backgroundColor: gray[200],
              },
              ...theme.applyStyles('dark', {
                backgroundColor: gray[800],
                borderColor: gray[700],

                '&:hover': {
                  backgroundColor: gray[900],
                  borderColor: gray[600],
                },
                '&:active': {
                  backgroundColor: gray[900],
                },
              }),
            },
          },
          {
            props: {
              color: 'secondary',
              variant: 'outlined',
            },
            style: {
              color: brand[700],
              border: '1px solid',
              borderColor: brand[200],
              backgroundColor: brand[50],
              '&:hover': {
                backgroundColor: brand[100],
                borderColor: brand[400],
              },
              '&:active': {
                backgroundColor: alpha(brand[200], 0.7),
              },
              ...theme.applyStyles('dark', {
                color: brand[50],
                border: '1px solid',
                borderColor: brand[900],
                backgroundColor: alpha(brand[900], 0.3),
                '&:hover': {
                  borderColor: brand[700],
                  backgroundColor: alpha(brand[900], 0.6),
                },
                '&:active': {
                  backgroundColor: alpha(brand[900], 0.5),
                },
              }),
            },
          },
          {
            props: {
              variant: 'text',
            },
            style: {
              color: gray[600],
              '&:hover': {
                backgroundColor: gray[100],
              },
              '&:active': {
                backgroundColor: gray[200],
              },
              ...theme.applyStyles('dark', {
                color: gray[50],
                '&:hover': {
                  backgroundColor: gray[700],
                },
                '&:active': {
                  backgroundColor: alpha(gray[700], 0.7),
                },
              }),
            },
          },
          {
            props: {
              color: 'secondary',
              variant: 'text',
            },
            style: {
              color: brand[700],
              '&:hover': {
                backgroundColor: alpha(brand[100], 0.5),
              },
              '&:active': {
                backgroundColor: alpha(brand[200], 0.7),
              },
              ...theme.applyStyles('dark', {
                color: brand[100],
                '&:hover': {
                  backgroundColor: alpha(brand[900], 0.5),
                },
                '&:active': {
                  backgroundColor: alpha(brand[900], 0.3),
                },
              }),
            },
          },
        ],
      }),
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        boxShadow: 'none',
        borderRadius: (theme.vars || theme).shape.borderRadius,
        textTransform: 'none',
        fontWeight: theme.typography.fontWeightMedium,
        letterSpacing: 0,
        color: (theme.vars || theme).palette.text.primary,
        border: '1px solid ',
        borderColor: gray[200],
        backgroundColor: alpha(gray[50], 0.3),
        '&:hover': {
          backgroundColor: gray[100],
          borderColor: gray[300],
        },
        '&:active': {
          backgroundColor: gray[200],
        },
        '.MuiAutocomplete-endAdornment &': {
          border: 'none',
          backgroundColor: 'transparent',
          borderRadius: '50%',
          width: 'auto',
          height: 'auto',
          padding: '2px',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'transparent' },
        },
        ...theme.applyStyles('dark', {
          backgroundColor: gray[800],
          borderColor: gray[700],
          '&:hover': {
            backgroundColor: gray[900],
            borderColor: gray[600],
          },
          '&:active': {
            backgroundColor: gray[900],
          },
        }),
        variants: [
          {
            props: {
              size: 'small',
            },
            style: {
              width: '2.25rem',
              height: '2.25rem',
              padding: '0.25rem',
              [`& .${svgIconClasses.root}`]: { fontSize: '1rem' },
            },
          },
          {
            props: {
              size: 'medium',
            },
            style: {
              width: '2.5rem',
              height: '2.5rem',
            },
          },
        ],
      }),
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: '10px',
        boxShadow: `0 4px 16px ${alpha(gray[400], 0.2)}`,
        [`& .${toggleButtonGroupClasses.selected}`]: {
          color: brand[500],
        },
        ...theme.applyStyles('dark', {
          [`& .${toggleButtonGroupClasses.selected}`]: {
            color: '#fff',
          },
          boxShadow: `0 4px 16px ${alpha(brand[700], 0.5)}`,
        }),
      }),
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: '12px 16px',
        textTransform: 'none',
        borderRadius: '10px',
        fontWeight: 500,
        ...theme.applyStyles('dark', {
          color: gray[400],
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
          [`&.${toggleButtonClasses.selected}`]: {
            color: brand[300],
          },
        }),
      }),
    },
  },
  MuiCheckbox: {
    defaultProps: {
      disableRipple: true,
      icon: (
        <CheckBoxOutlineBlankRoundedIcon sx={{ opacity: 0, fontSize: 15 }} />
      ),
      checkedIcon: (
        <CheckRoundedIcon sx={{ fontSize: 15, color: 'currentColor' }} />
      ),
      indeterminateIcon: (
        <RemoveRoundedIcon sx={{ fontSize: 15, color: 'currentColor' }} />
      ),
    },
    styleOverrides: {
      root: ({ theme }) => ({
        padding: 6,
        margin: 0,
        width: 20,
        height: 20,
        boxSizing: 'border-box',
        borderRadius: 6,
        border: '1.5px solid',
        borderColor: alpha(gray[400], 0.55),
        backgroundColor: alpha(gray[50], 0.08),
        color: gray[600],
        transition: 'border-color 120ms ease, background-color 120ms ease, color 120ms ease',
        '&:hover': {
          borderColor: alpha(brand[400], 0.65),
          backgroundColor: alpha(gray[100], 0.35),
        },
        '&.Mui-focusVisible': {
          outline: `2px solid ${alpha(brand[500], 0.45)}`,
          outlineOffset: 2,
          borderColor: brand[400],
        },
        '& .MuiSvgIcon-root': {
          fontSize: 15,
        },
        '&.Mui-checked': {
          color: brand[700],
          backgroundColor: alpha(brand[500], 0.14),
          borderColor: alpha(brand[500], 0.85),
          '&:hover': {
            backgroundColor: alpha(brand[500], 0.22),
            borderColor: brand[600],
          },
        },
        '&.MuiCheckbox-indeterminate': {
          color: brand[700],
          backgroundColor: alpha(brand[500], 0.14),
          borderColor: alpha(brand[500], 0.85),
          '&:hover': {
            backgroundColor: alpha(brand[500], 0.22),
            borderColor: brand[600],
          },
        },
        '&.Mui-disabled': {
          opacity: 0.45,
        },
        ...theme.applyStyles('dark', {
          borderColor: alpha(gray[500], 0.55),
          backgroundColor: alpha(gray[800], 0.4),
          color: gray[400],
          '&:hover': {
            borderColor: alpha(brand[300], 0.55),
            backgroundColor: alpha(gray[700], 0.35),
          },
          '&.Mui-focusVisible': {
            borderColor: alpha(brand[300], 0.8),
            outline: `2px solid ${alpha(brand[400], 0.4)}`,
            outlineOffset: 2,
          },
          '&.Mui-checked': {
            color: brand[100],
            backgroundColor: alpha(brand[500], 0.22),
            borderColor: alpha(brand[300], 0.65),
            '&:hover': {
              backgroundColor: alpha(brand[500], 0.32),
              borderColor: alpha(brand[200], 0.85),
            },
          },
          '&.MuiCheckbox-indeterminate': {
            color: brand[100],
            backgroundColor: alpha(brand[500], 0.22),
            borderColor: alpha(brand[300], 0.65),
            '&:hover': {
              backgroundColor: alpha(brand[500], 0.32),
              borderColor: alpha(brand[200], 0.85),
            },
          },
        }),
      }),
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        border: 'none',
      },
      input: {
        '&::placeholder': {
          opacity: 0.7,
          color: gray[500],
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      input: {
        padding: 0,
      },
      root: ({ theme }) => ({
        padding: '8px 12px',
        color: (theme.vars || theme).palette.text.primary,
        borderRadius: (theme.vars || theme).shape.borderRadius,
        border: `1px solid ${(theme.vars || theme).palette.divider}`,
        backgroundColor: (theme.vars || theme).palette.background.default,
        transition: 'border 120ms ease-in',
        '&:hover': {
          borderColor: gray[400],
        },
        [`&.${outlinedInputClasses.focused}`]: {
          outline: `3px solid ${alpha(brand[500], 0.5)}`,
          borderColor: brand[400],
        },
        ...theme.applyStyles('dark', {
          '&:hover': {
            borderColor: gray[500],
          },
        }),
        variants: [
          {
            props: {
              size: 'small',
            },
            style: {
              height: '2.25rem',
            },
          },
          {
            props: {
              size: 'medium',
            },
            style: {
              height: '2.5rem',
            },
          },
          {
            props: {
              multiline: true,
            },
            style: {
              height: 'auto',
              minHeight: 0,
              alignItems: 'stretch',
            },
          },
        ],
      }),
      // Keep a 1px outline so the <legend> notch still sizes correctly for the floating label.
      // border: 'none' breaks InputLabel position (label sits on the border line).
      notchedOutline: {
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'transparent',
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        // MuiFormLabel adds marginBottom for standalone labels; InputLabel must not have it.
        marginBottom: 0,
      },
    },
  },
  MuiInputAdornment: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: (theme.vars || theme).palette.grey[500],
        ...theme.applyStyles('dark', {
          color: (theme.vars || theme).palette.grey[400],
        }),
      }),
    },
  },
  MuiFormLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        typography: theme.typography.caption,
        // Do not affect TextField / Autocomplete floating labels (MuiInputLabel-root).
        '&:not(.MuiInputLabel-root)': {
          marginBottom: 8,
        },
      }),
    },
  },
};
