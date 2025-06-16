import * as React from 'react'
import Document, { Html, Head, Main, NextScript } from 'next/document'
import { DocumentHeadTags, DocumentHeadTagsProps } from '@mui/material-nextjs/v14-pagesRouter'
import { roboto } from '../lib/theme'
import { createAppTheme } from '../lib/theme'

export default class MyDocument extends Document<DocumentHeadTagsProps> {
  render() {
    // Create a default theme instance for server-side rendering
    const defaultTheme = createAppTheme('dark');

    return (
      <Html lang="en" className={roboto.className}>
        <Head>
          <meta name="theme-color" content={defaultTheme.palette.primary.main} />
          <link rel="shortcut icon" href="/favicon.ico" />
          <meta name="emotion-insertion-point" content="" />
          <DocumentHeadTags {...this.props} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
