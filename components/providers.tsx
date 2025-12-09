"use client";

import { PropsWithChildren } from "react";
import { MetabaseAppProvider } from "./metabase-provider";

export function Providers({ children }: PropsWithChildren) {
  return (
    <MetabaseAppProvider>
      {children}
    </MetabaseAppProvider>
  );
}
