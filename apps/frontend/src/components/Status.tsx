import type React from "react";

export function Banner({ tone = "info", children }: { tone?: "info" | "error"; children: React.ReactNode }) {
  return <div className={`banner ${tone}`}>{children}</div>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <h4>{title}</h4>
      <p>{body}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="loading">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
