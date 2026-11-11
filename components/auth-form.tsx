"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Boxes, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { apiRequest, AuthSession, saveSession } from "@/lib/api";
import PublicRouteGuard from "@/components/public-route-guard";
import { showAlert, showToast } from "@/lib/alerts";

type AuthFormProps = { mode: "login" | "register" };

export default function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRegister && password !== confirmPassword) {
      void showAlert("warning", "Passwords don't match", "Please make sure both password fields are the same.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({ username: username.trim(), password, role: "user" }),
        });
        setSuccess(true);
      } else {
        const session = await apiRequest<AuthSession>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username: username.trim(), password }),
        });
        saveSession(session);
        void showToast("success", "Welcome back!");
        router.replace("/dashboard");
      }
    } catch (requestError) {
      void showAlert(
        "error",
        isRegister ? "Could not create your account" : "Could not sign in",
        requestError instanceof Error ? requestError.message : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicRouteGuard>
    <main className="auth-page">
      <div className="auth-backdrop auth-backdrop-left" aria-hidden="true" />
      <div className="auth-backdrop auth-backdrop-right" aria-hidden="true" />
      <header className="auth-nav">
        <Link href="/" className="brand"><span className="brand-mark"><Boxes size={20} strokeWidth={2.5} /></span><span>Tabletop</span></Link>
      </header>

      <section className="auth-layout">
        <div className="auth-aside">
          <span className="eyebrow"><span className="eyebrow-dot" /> a little more organized</span>
          <h1>{isRegister ? <>Your Workspace<br />Starts <span>Right Here.</span></> : <>Good To<br />See You <span>Again.</span></>}</h1>
          <p>{isRegister ? "Bring your data together and make the everyday feel a little easier." : "Your tables have been keeping things tidy while you were away."}</p>
          <div className="auth-aside-note"><span>simple setup, happy data</span></div>
        </div>

        <div className="auth-card">
          <div className="auth-card-deco" aria-hidden="true" />
          {success ? (
            <div className="success-panel">
              <span className="success-icon">✓</span>
              <span className="eyebrow">you’re all set</span>
              <h2>Account created!</h2>
              <p>Your new account is ready. Head to sign in and let’s take a look around.</p>
              <Link className="button button-full" href="/login">Go to sign in <ArrowRight size={18} /></Link>
            </div>
          ) : (
            <>
              <span className="eyebrow">{isRegister ? "let’s get you started" : "welcome back"}</span>
              <h2>{isRegister ? "Create Your Account" : "Sign In To Tabletop"}</h2>
              <p className="form-intro">{isRegister ? "It only takes a minute to get set up." : "Your workspace is just a sign-in away."}</p>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="field-label" htmlFor="username">Email or username</label>
                <div className="input-wrap"><Mail size={18} /><input id="username" name="username" type="text" autoComplete="username" placeholder="you@example.com" value={username} onChange={(event) => setUsername(event.target.value)} required /></div>

                <label className="field-label" htmlFor="password">Password</label>
                <div className="input-wrap"><LockKeyhole size={18} /><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /><button className="reveal-button" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

                {isRegister && <>
                  <label className="field-label" htmlFor="confirm-password">Confirm password</label>
                  <div className="input-wrap"><LockKeyhole size={18} /><input id="confirm-password" name="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Type it one more time" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} required /></div>
                </>}

                <button className="button button-full" type="submit" disabled={loading}>
                  {loading ? "One moment..." : isRegister ? "Create account" : "Sign in"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              {isRegister && <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>}
              <div className="auth-safe"><span className="safe-check">✓</span> your password is securely protected</div>
            </>
          )}
        </div>
      </section>
      <footer className="auth-footer"><Link href="/"><Boxes size={15} /> Tabletop</Link><span>little tables. big picture.</span></footer>
    </main>
    </PublicRouteGuard>
  );
}
