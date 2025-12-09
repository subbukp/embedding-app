"use client";

import {
  MetabaseProvider,
  defineMetabaseAuthConfig,
  defineMetabaseTheme,
} from "@metabase/embedding-sdk-react/nextjs";
import { PropsWithChildren } from "react";

if (!process.env.NEXT_PUBLIC_METABASE_INSTANCE_URL) {
  throw new Error("Missing NEXT_PUBLIC_METABASE_INSTANCE_URL");
}

const authConfig = defineMetabaseAuthConfig({
  metabaseInstanceUrl: process.env.NEXT_PUBLIC_METABASE_INSTANCE_URL,
  fetchRequestToken: async () => {
    console.log('[MetabaseProvider] Fetching auth token from /api/metabase/auth');

    const response = await fetch('/api/metabase/auth?response=json', {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      console.error('[MetabaseProvider] Failed to fetch token:', response.status);
      const errorText = await response.text();
      console.error('[MetabaseProvider] Error response:', errorText);
      throw new Error('Failed to fetch Metabase auth token');
    }

    const data = await response.json();
    console.log('[MetabaseProvider] Auth token received');
    return data;
  },
});

const theme = defineMetabaseTheme({
  fontFamily: "Lato",
  fontSize: "14px",
  lineHeight: 1.5,
  colors: {
    brand: "#6b88bd",
    "text-primary": "#0F172A",
    "text-secondary": "#64748B",
    "text-tertiary": "#94A3B8",
    background: "#FFFFFF",
    "background-hover": "#F8FAFC",
    border: "#E2E8F0",
    filter: "#6b88bd",
    summarize: "#5e749c",
    shadow: "rgba(0,0,0,0.1)",
  },
  components: {
    dashboard: {
      backgroundColor: "#FFFFFF",
      card: {
        backgroundColor: "#FFFFFF",
      },
    },
    question: {
      backgroundColor: "#FFFFFF",
    },
    table: {
      cell: {
        textColor: "#0F172A",
        backgroundColor: "#FFFFFF",
      },
    },
  },
});

export function MetabaseAppProvider({ children }: PropsWithChildren) {
  console.log('[MetabaseProvider] Initializing with URL:', process.env.NEXT_PUBLIC_METABASE_INSTANCE_URL);

  return (
    <MetabaseProvider authConfig={authConfig} theme={theme}>
      {children}
    </MetabaseProvider>
  );
}
