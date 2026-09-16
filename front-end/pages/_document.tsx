import * as React from 'react';
import { Head, Html, Main, NextScript } from 'next/document';
import baseTheme from '../theme/baseTheme';

export default function MyDocument() {
    return (
        <Html lang="en">
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&family=Stack+Sans+Headline:wght@300;400;500;700&family=Stack+Sans+Text:wght@300;400;500;700&display=swap" rel="stylesheet" />
                {/* PWA primary color */}
                <meta
                    name="theme-color"
                    content={baseTheme.palette.primary.main}
                />
                <link rel="shortcut icon" href="/favicon.ico" />
                <meta name="emotion-insertion-point" content="" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
