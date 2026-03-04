'use client';

import { UserProvider } from "@/context/UserContext";
import { ClientProvider } from "@/context/ClientContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ClientProvider>
        {children}
      </ClientProvider>
    </UserProvider>
  );
}
