"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Login and password-reset prototype state. There's no backend: this only carries what the next
 * screen shows (who is signing in, where the reset link went) and lives in sessionStorage.
 */

/** The one password that logs in (any well-formed email or phone number). */
export const DEMO_PASSWORD = "ForenBusiness2026!!!";

export type LoginMethod = "email" | "phone";

type LoginState = {
  method: LoginMethod;
  /** Email address, or the phone number with its dialling code. */
  identifier: string;
  remember: boolean;
  /** Where the password reset link was sent. */
  resetEmail: string;
  set: (patch: Partial<Omit<LoginState, "set">>) => void;
};

export const useLogin = create<LoginState>()(
  persist(
    (set) => ({
      method: "email",
      identifier: "",
      remember: false,
      resetEmail: "",
      set: (patch) => set(patch),
    }),
    { name: "foren-login-v1", storage: createJSONStorage(() => sessionStorage) }
  )
);

/** Simulated sign-in check: only the demo password gets through. */
export const credentialsOk = (password: string) => password === DEMO_PASSWORD;
