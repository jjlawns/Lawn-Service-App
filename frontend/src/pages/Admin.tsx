import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, LogOut, Phone } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch, apiPost, ApiError } from "@/lib/api";
import { telHref } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuoteLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  zip: string | null;
  acres: number | null;
  plan: string;
  overgrowth: string | null;
  corner_lot?: boolean;
  estimate: number | null;
  notes: string;
  status?: string;
  created_at: string;
}

const STATUSES = ["new", "contacted", "won", "lost"] as const;
const STATUS_STYLES: Record<string, string> = {
  new: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  contacted: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  won: "bg-emerald-500 text-[#042F24] border-emerald-500",
  lost: "bg-[#1E3328] text-[#5C6F64] border-[#1E3328]",
};

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => apiPost("/auth/login", { password }),
    onSuccess,
    onError: (e) =>
      setError(e instanceof ApiError && e.status === 429
        ? "Too many attempts — wait 15 minutes."
        : "Wrong password."),
  });

  return (
    <div className="mx-auto mt-24 w-full max-w-sm rounded-2xl border border-[#1E3328] bg-[#122019] p-8">
      <div className="mb-6 flex items-center gap-3">
        <Lock className="h-5 w-5 text-emerald-400" />
        <h1 className="font-heading text-xl text-[#F3F7F4]">Owner login</h1>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <Input
          type="password"
          data-testid="admin-password-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Dashboard password"
          className="h-12 border-[#1E3328] bg-[#0B1510] text-[#F3F7F4] placeholder:text-[#5C6F64]"
        />
        {error && (
          <p className="text-sm text-red-400" data-testid="admin-login-error">{error}</p>
        )}
        <Button
          type="submit"
          data-testid="admin-login-btn"
          disabled={!password || mutation.isPending}
          className="h-12 rounded-xl bg-emerald-500 font-semibold text-[#042F24] hover:bg-emerald-400"
        >
          {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Open dashboard"}
        </Button>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const queryClient = useQueryClient();
  const { data: leads, isLoading, isError } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: () => apiGet<QuoteLead[]>("/admin/quotes"),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPatch(`/admin/quotes/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-quotes"] }),
    onError: () => toast.error("Could not update status."),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-[#F3F7F4]">Quote requests</h1>
          <p className="mt-1 text-sm text-[#A2B4AA]" data-testid="lead-count">
            {leads ? `${leads.length} lead${leads.length === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <Button
          data-testid="admin-logout-btn"
          onClick={onLogout}
          className="rounded-full border border-[#1E3328] bg-transparent text-[#A2B4AA] hover:border-emerald-500/40 hover:text-[#F3F7F4]"
        >
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-red-400" data-testid="leads-error">
          Could not load leads — your session may have expired. Log in again.
        </p>
      )}
      {isLoading && <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />}
      {leads && leads.length === 0 && (
        <p className="rounded-xl border border-[#1E3328] bg-[#122019] p-8 text-center text-[#A2B4AA]" data-testid="leads-empty">
          No quote requests yet. New submissions from the website appear here instantly.
        </p>
      )}

      <div className="flex flex-col gap-4" data-testid="leads-list">
        {leads?.map((lead) => {
          const status = lead.status && STATUSES.includes(lead.status as never) ? lead.status : "new";
          return (
            <article
              key={lead.id}
              data-testid={`lead-card-${lead.id}`}
              className="rounded-2xl border border-[#1E3328] bg-[#122019] p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl text-[#F3F7F4]">{lead.name}</h2>
                  <p className="mt-0.5 text-xs text-[#5C6F64]">
                    {new Date(lead.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex gap-1.5" role="radiogroup" aria-label="Lead status">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      role="radio"
                      aria-checked={status === s}
                      data-testid={`lead-status-${s}-${lead.id}`}
                      onClick={() => statusMutation.mutate({ id: lead.id, status: s })}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors ${STATUS_STYLES[s]} ${
                        status === s ? "" : "opacity-45 hover:opacity-100"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <p className="text-[#A2B4AA]">
                  <a href={telHref(lead.phone)} className="font-semibold text-emerald-300 hover:text-emerald-200" data-testid={`lead-phone-${lead.id}`}>
                    <Phone className="mr-1 inline h-3.5 w-3.5" />{lead.phone}
                  </a>
                  {" · "}
                  <a href={`mailto:${lead.email}`} className="text-emerald-300 hover:text-emerald-200" data-testid={`lead-email-${lead.id}`}>
                    {lead.email}
                  </a>
                </p>
                <p className="text-[#A2B4AA]">{lead.address}</p>
                <p className="text-[#A2B4AA]">
                  {lead.plan === "monthly" ? "Monthly service" : "One-time cleanup"}
                  {lead.acres ? ` · ${lead.acres.toFixed(2)} ac` : ""}
                  {lead.corner_lot ? " · corner lot" : ""}
                  {lead.overgrowth && lead.overgrowth !== "recent" ? ` · overgrowth: ${lead.overgrowth}` : ""}
                </p>
                <p className="font-heading text-lg text-emerald-400" data-testid={`lead-estimate-${lead.id}`}>
                  {lead.estimate ? `$${lead.estimate}${lead.plan === "monthly" ? "/mo" : ""}` : "—"}
                </p>
              </div>
              {lead.notes && (
                <p className="mt-3 rounded-lg bg-[#0B1510] p-3 text-sm text-[#A2B4AA]">“{lead.notes}”</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function Admin() {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => apiGet<{ email: string }>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });

  const logout = async () => {
    await apiPost("/auth/logout").catch(() => undefined);
    queryClient.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-[#1E3328]">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-8">
          <Logo className="h-7 w-7 text-emerald-400" />
          <span className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-[#F3F7F4]">
            J&amp;J Lawn &amp; Landscape
          </span>
          <span className="ml-2 rounded-full border border-[#1E3328] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#A2B4AA]">
            Owner
          </span>
        </div>
      </header>
      {me.isPending && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      )}
      {me.isError && (
        <LoginForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-me"] })} />
      )}
      {me.data && <Dashboard onLogout={logout} />}
    </div>
  );
}
