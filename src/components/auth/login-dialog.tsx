"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import Marquee from "react-fast-marquee";

export function LoginDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setOpen(false);
    } catch (err: any) {
      setError(err?.message ?? "Unable to sign in with email and password.");
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogleLogin() {
    setLoading("google");
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setOpen(false);
    } catch (err: any) {
      setError(err?.message ?? "Unable to sign in with Google.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-sm font-medium text-foreground/90 hover:text-foreground transition-colors"
        >
          Login
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md border border-border bg-muted sm:rounded-xl shadow-xl">
        <div className="mb-3 overflow-hidden rounded-full bg-background/60 border border-border">
          <Marquee
            gradient={false}
            speed={25}
            pauseOnHover
            className="px-4 py-1 text-xs md:text-sm font-medium text-primary"
          >
            <span className="mx-4">
              Hare Krishna Hare Krishna Krishna Krishna Hare Hare, Hare Rama Hare Rama Rama Rama Hare Hare.
            </span>
          </Marquee>
        </div>
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Login to GIVE</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 mt-2" onSubmit={handleEmailLogin}>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-input bg-background"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-input bg-background"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-3 pt-1">
            <Button type="submit" className="w-full" disabled={loading !== null}>
              {loading === "email" ? "Signing in..." : "Login with Email"}
            </Button>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border border-input bg-background hover:bg-muted"
              onClick={handleGoogleLogin}
              disabled={loading !== null}
            >
              {loading === "google" ? (
                "Connecting to Google..."
              ) : (
                <>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-white">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.8l3 2.3c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.4-.2-2H12z"
                      />
                      <path
                        fill="#34A853"
                        d="M6.6 14.3l-.5.4-2.4 1.9C5.1 18.9 8.3 21 12 21c2.4 0 4.4-.8 5.8-2.2l-3-2.3c-.8.5-1.8.8-2.8.8-2.2 0-4.1-1.5-4.8-3.6z"
                      />
                      <path
                        fill="#4A90E2"
                        d="M4.2 8.6C3.7 9.6 3.4 10.7 3.4 12s.3 2.4.8 3.4c0 0 2.3-1.8 2.4-1.9-.2-.5-.3-1-.3-1.5s.1-1 .3-1.5z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M12 6.4c1.3 0 2.5.4 3.4 1.3l2.5-2.5C16.4 3.8 14.4 3 12 3 8.3 3 5.1 5.1 3.4 8.6l3.1 2.4C7.9 7.9 9.8 6.4 12 6.4z"
                      />
                    </svg>
                  </span>
                  <span>Continue with Google</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


