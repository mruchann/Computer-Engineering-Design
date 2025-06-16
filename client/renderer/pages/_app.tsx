import React from 'react'
import Head from 'next/head'
import { AppProps } from 'next/app'
import { AppCacheProvider } from '@mui/material-nextjs/v14-pagesRouter'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider as CustomThemeProvider } from '../contexts/ThemeContext'
import { createAppTheme } from '../lib/theme'
import AuthGuard from '../components/AuthGuard'

export default function MyApp(props: AppProps) {
  const { Component, pageProps } = props

  return (
    <AppCacheProvider {...props}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <CustomThemeProvider>
        {(mode) => (
          <MuiThemeProvider theme={createAppTheme(mode)}>
            <CssBaseline />
            <AuthGuard>
              <Component {...pageProps} />
            </AuthGuard>
          </MuiThemeProvider>
        )}
      </CustomThemeProvider>
    </AppCacheProvider>
  )
}
