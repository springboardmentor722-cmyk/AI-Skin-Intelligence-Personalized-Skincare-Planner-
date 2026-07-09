"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import { api } from "@/lib/api";

type Role = "consultant" | "dermatologist";
type Action = "approve" | "reject" | "request-info" | "suspend" | "deactivate";

const REASON_REQUIRED: Action[] = ["reject", "request-info", "suspend"];

const ACTION_LABELS: Record<Action, string> = {
  approve: "Approve",
  reject: "Reject",
  "request-info": "Request more info",
  suspend: "Suspend",
  deactivate: "Deactivate",
};

// snake_case field name -> label. Union of both roles' fields, rendered dynamically
// (whichever the loaded profile actually has) — this page reviews whichever role is
// in the URL, without a separate hand-built layout for each.
const FIELD_LABELS: Record<string, string> = {
  qualifications: "Qualifications",
  years_of_experience: "Years of experience",
  current_organization: "Current organization",
  license_number: "License number",
  specializations: "Specializations",
  areas_of_expertise: "Areas of expertise",
  languages: "Languages",
  consultation_modes: "Consultation modes",
  availability: "Availability",
  biography: "Biography",
  linkedin_url: "LinkedIn",
  portfolio_url: "Portfolio",
  clinic_address: "Clinic address",
  medical_registration_number: "Medical registration number",
  medical_council: "Medical council",
  hospital_clinic: "Hospital / clinic",
  years_of_practice: "Years of practice",
  degrees: "Degrees",
  board_certifications: "Board certifications",
  research_interests: "Research interests",
  professional_biography: "Professional biography",
  phone: "Phone",
  location: "Location",
};

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return String(value);
}

export default function VerificationReviewPage() {
  const params = useParams<{ role: string; userId: string }>();
  const role = params.role as Role;
  const userId = params.userId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<Action | null>(null);

  const reviewQuery = useQuery({
    queryKey: ["admin", "verification-review", role, userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/verification-queue/{role}/{user_id}", {
        params: { path: { role, user_id: userId } },
      });
      if (error) throw new Error("Failed to load profile");
      return data;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (action: Action) => {
      const path =
        action === "approve"
          ? "/api/v1/admin/verification-queue/{role}/{user_id}/approve"
          : action === "reject"
            ? "/api/v1/admin/verification-queue/{role}/{user_id}/reject"
            : action === "request-info"
              ? "/api/v1/admin/verification-queue/{role}/{user_id}/request-info"
              : action === "suspend"
                ? "/api/v1/admin/verification-queue/{role}/{user_id}/suspend"
                : "/api/v1/admin/verification-queue/{role}/{user_id}/deactivate";
      const { error } = await api.POST(path, {
        params: { path: { role, user_id: userId } },
        body: { reason: reason.trim() || null },
      });
      if (error) throw new Error("Action failed");
    },
    onSuccess: (_data, action) => {
      toast.success(`${ACTION_LABELS[action]} recorded`);
      setReason("");
      setPendingAction(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "verification-review", role, userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "verification-queue"] });
    },
    onError: () => toast.error("That action didn't go through. Try again."),
  });

  const viewDocument = async (documentId: number) => {
    const { data, error } = await api.GET(
      "/api/v1/admin/verification-queue/{role}/{user_id}/documents/{document_id}/url",
      { params: { path: { role, user_id: userId, document_id: documentId } } }
    );
    if (error || !data) {
      toast.error("Couldn't open that document.");
      return;
    }
    window.open(data.url, "_blank", "noopener,noreferrer");
  };

  const handleAction = (action: Action) => {
    if (REASON_REQUIRED.includes(action) && !reason.trim()) {
      setPendingAction(action);
      toast.error("A reason is required for this action.");
      return;
    }
    actionMutation.mutate(action);
  };

  if (reviewQuery.isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (reviewQuery.isError || !reviewQuery.data) {
    return (
      <StateCard
        tone="destructive"
        icon={TriangleAlert}
        description="Couldn't load this application."
        action={
          <Button variant="outline" onClick={() => router.back()}>
            <RotateCw className="size-4" strokeWidth={1.5} />
            Go back
          </Button>
        }
      />
    );
  }

  const { profile, documents } = reviewQuery.data;
  const fieldEntries = Object.entries(profile).filter(
    ([key]) => key in FIELD_LABELS
  ) as [string, unknown][];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold capitalize">
          {role} application
        </h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          {userId} — currently{" "}
          <span className="font-semibold capitalize">
            {profile.verification_status.replace(/_/g, " ")}
          </span>
        </p>
      </div>

      <div className="border-border bg-card rounded-2xl border p-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fieldEntries.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-on-surface-variant font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
                {FIELD_LABELS[key]}
              </dt>
              <dd className="text-on-surface font-sans text-sm break-words">
                {formatValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-6">
        <h2 className="font-heading text-on-surface text-base font-semibold">
          Verification documents
        </h2>
        {documents.length === 0 ? (
          <p className="text-on-surface-variant font-sans text-sm">No documents uploaded.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {documents.map((doc) => (
              <li
                key={doc.document_id}
                className="bg-muted flex items-center justify-between rounded-lg px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <FileText className="text-on-surface-variant size-4" strokeWidth={1.5} />
                  <span className="font-sans text-sm">{doc.original_filename}</span>
                  <span className="text-on-surface-variant font-sans text-xs capitalize">
                    ({doc.document_type.replace(/_/g, " ")})
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => viewDocument(doc.document_id)}>
                  View
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="reason"
            className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase"
          >
            Reason <span className="normal-case">(required for reject / request info / suspend)</span>
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain your decision — the applicant sees this on their dashboard."
            className="bg-muted text-on-surface placeholder:text-on-surface-variant/50 focus:ring-secondary/40 w-full resize-none rounded-xl border-none p-4 font-sans text-sm focus:ring-2 focus:outline-none"
          />
          {pendingAction && !reason.trim() && (
            <p className="text-destructive text-xs">A reason is required for this action.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => handleAction("approve")} disabled={actionMutation.isPending}>
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction("reject")}
            disabled={actionMutation.isPending}
          >
            Reject
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction("request-info")}
            disabled={actionMutation.isPending}
          >
            Request more info
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction("suspend")}
            disabled={actionMutation.isPending}
          >
            Suspend
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleAction("deactivate")}
            disabled={actionMutation.isPending}
          >
            Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
}
