import { useState } from "react";
import type { AdminUser } from "../api/types";
import type { ApiClient } from "../api/client";
import { Button, Field, Input } from "../components/ui";
import { Banner } from "../components/Status";
import { Section } from "../components/Section";

type AuthSectionProps = {
  token: string | null;
  user: AdminUser | null;
  onAuth: (token: string) => void;
  onLogout: () => void;
  api: ApiClient;
};

export function AuthSection({ token, user, onAuth, onLogout, api }: AuthSectionProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.login({ email: loginEmail, password: loginPassword });
      onAuth(result.token);
      setLoginPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.register({ email: registerEmail, password: registerPassword });
      onAuth(result.token);
      setRegisterPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section
      title="Authentication"
      subtitle="Admin registration and login powers the entire workflow."
      actions={
        token ? (
          <Button variant="ghost" onClick={onLogout}>
            Sign out
          </Button>
        ) : null
      }
    >
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div className="grid two">
        <div className="card">
          <div className="card-header">
            <h3>Admin Login</h3>
            <p>Access the dashboard and generation tools.</p>
          </div>
          <div className="card-body">
            <Field label="Email">
              <Input value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </Field>
            <Button variant="primary" onClick={handleLogin} disabled={loading || !loginEmail || !loginPassword}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3>Admin Registration</h3>
            <p>Create the first admin or add another team member.</p>
          </div>
          <div className="card-body">
            <Field label="Email">
              <Input value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} />
            </Field>
            <Field label="Password" hint="Minimum 8 characters">
              <Input
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
              />
            </Field>
            <Button
              variant="outline"
              onClick={handleRegister}
              disabled={loading || !registerEmail || registerPassword.length < 8}
            >
              {loading ? "Creating..." : "Create admin"}
            </Button>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Session</h3>
          <p>Confirm the active admin account.</p>
        </div>
        <div className="card-body">
          {token && user ? (
            <div className="pill">Logged in as {user.email}</div>
          ) : (
            <div className="pill muted">Not authenticated</div>
          )}
        </div>
      </div>
    </Section>
  );
}
