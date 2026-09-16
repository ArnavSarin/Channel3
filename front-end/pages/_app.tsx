import Head from 'next/head';
import { AppProps } from 'next/app';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import baseTheme from '../theme/baseTheme';
import './globals.scss';

export default function MyApp(props: AppProps) {
    const { Component, pageProps } = props;

    return (
        <>
            <Head>
                <meta
                    name="viewport"
                    content="initial-scale=1, width=device-width"
                />
            </Head>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={baseTheme}>
                    <CssBaseline />
                    <Component {...pageProps} />
                </ThemeProvider>
            </StyledEngineProvider>
        </>
    );
}
