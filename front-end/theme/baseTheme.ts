import { createTheme, Theme } from '@mui/material/styles';

//TODO: MAKE ALL SCSS IMPORTABLE TO JAVASCRIPT

export const baseThemeOptions = {
    palette: {
        primary: {
            main: '#1C2E4A',
        },
        secondary: {
            main: '#5A7287',
        },
        error: {
            main: '#C22718',
        },
        text: {
            primary: '#0E1826',
            secondary: '#5A7287',
        },
        background: {
            default: '#FFFFFF',
            paper: '#FFFFFF',
        },
    },
    typography: {
        fontFamily: '"Stack Sans Text", Inter, sans-serif',
        h1: {
            fontSize: '28px',
            fontWeight: '500',
            fontFamily: '"Stack Sans Headline", "Stack Sans Text", Inter, sans-serif',
        },
        h2: {
            fontSize: '22px',
            fontWeight: '500',
            fontFamily: '"Stack Sans Headline", "Stack Sans Text", Inter, sans-serif',
        },
        h3: {
            fontSize: '18px',
            fontWeight: '500',
            fontFamily: '"Stack Sans Headline", "Stack Sans Text", Inter, sans-serif',
        },
        h4: {
            fontSize: '14px',
            fontWeight: '400',
        },
        h5: {
            fontSize: '12px',
            fontWeight: '300',
        },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    width: 'calc(100% - 16em)',
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    width: '100%',
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    border: '1px solid #DFE4EB',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                root: {
                    '& .MuiPaper-root': {
                        visibility: 'unset !important',
                        transform: 'unset !important',
                        boxSizing: 'border-box',
                        width: '16em',
                        height: '100%',
                    },
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': {
                        color: '#0E1826',
                        boxShadow:
                            '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                        borderRadius: '8px',
                        '&:hover': {
                            color: '#0E1826',
                            boxShadow:
                                '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                            borderRadius: '8px',
                        },
                    },
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                InputLabelProps: { shrink: true },
            },
            styleOverrides: {
                root: ({ theme }: { theme: Theme }) => ({
                    width: '100%',
                    backgroundColor: '#F3F5F7',
                    '& .MuiInputLabel-root': {
                        color: theme.palette.secondary.main,

                        '& .Mui-focused': {
                            color: theme.palette.primary.main,
                        },
                    },
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        '& fieldset': {
                            borderColor: theme.palette.secondary.main,
                        },
                        '& .Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                        },
                        '& input::placeholder': {
                            color: theme.palette.text.secondary,
                            opacity: 1,
                        },
                    },
                }),
            },
        },
    },
};

const baseTheme = createTheme(baseThemeOptions);

export default baseTheme;
