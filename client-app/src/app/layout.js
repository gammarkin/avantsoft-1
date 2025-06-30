import { Geist, Geist_Mono } from "next/font/google";

import '@mantine/core/styles.css';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const theme = {
  colorScheme: 'dark',
  fontFamily: 'var(--font-geist-sans)',
  headings: { fontFamily: 'var(--font-geist-sans)' },
  primaryColor: 'blue',
};

export const metadata = {
  title: "Avanthsoft",
  description: "For a technology-driven future",
};

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <ColorSchemeScript defaultColorScheme="light" />
      </head>

      <body
        style={{
          '--font-geist-sans': geistSans.variable,
          '--font-geist-mono': geistMono.variable,
        }}
        className="antialiased"
      >
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
