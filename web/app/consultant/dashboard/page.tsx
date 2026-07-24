"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  Clock,
  FileText,
  Loader2,
  Mail,
  RotateCw,
  ShieldAlert,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";

import { ClinicalDashboard } from "@/components/clinical-review/clinical-dashboard";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import { seedOnboardingDraft } from "@/lib/consultant-onboarding/context";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

const LABEL_CLASS =
  "font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase";

type ConsultantProfile = components["schemas"]["ConsultantProfileRead"];
// FastAPI OpenAPI dedup: both admin/schemas.py and consultant_profile/schemas.py
// declare a `VerificationDocumentRead` class, so the generated component name is
// qualified by module path to disambiguate them.
type VerificationDocument =
  components["schemas"]["app__services__consultant_profile__schemas__VerificationDocumentRead"];
type DocumentType =
  components["schemas"]["Body_upload_my_document_api_v1_consultant_profiles_me_documents_post"]["document_type"];

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "professional_certificate", label: "Professional certificate" },
  { value: "medical_license", label: "Medical license" },
  { value: "government_id", label: "Government ID" },
  { value: "supporting_document", label: "Supporting document" },
];

const STATUS_COPY: Record<
  ConsultantProfile["verification_status"],
  { title: string; body: string; icon: typeof Clock; tone: "warning" | "destructive" | "success" }
> = {
  pending: {
    title: "Your application is under review",
    body: "Our team reviews new consultant applications within a few business days. You'll be notified once a decision is made.",
    icon: Clock,
    tone: "warning",
  },
  more_info_requested: {
    title: "More information needed",
    body: "Our review team needs a bit more from you before they can continue — see the note below, then edit your profile or upload the missing document.",
    icon: TriangleAlert,
    tone: "warning",
  },
  rejected: {
    title: "Your application wasn't approved",
    body: "See the reviewer's note below. You can update your application and resubmit at any time.",
    icon: X,
    tone: "destructive",
  },
  suspended: {
    title: "Your account is suspended",
    body: "Your consultant account has been temporarily suspended. Contact support for details.",
    icon: ShieldAlert,
    tone: "destructive",
  },
  deactivated: {
    title: "Your account is deactivated",
    body: "Your consultant account has been deactivated. Contact support if you believe this is a mistake.",
    icon: ShieldAlert,
    tone: "destructive",
  },
  approved: {
    title: "You're verified",
    body: "Your consultant account is approved and active.",
    icon: BadgeCheck,
    tone: "success",
  },
};

const TONE_CLASSES: Record<string, string> = {
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
};

function ProfileSummaryCard({ profile }: { profile: ConsultantProfile }) {
  const router = useRouter();

  const editProfile = () => {
    seedOnboardingDraft({
      qualifications: profile.qualifications ?? "",
      yearsOfExperience: profile.years_of_experience,
      currentOrganization: profile.current_organization ?? "",
      licenseNumber: profile.license_number ?? "",
      specializations: profile.specializations ?? [],
      areasOfExpertise: profile.areas_of_expertise ?? [],
      languages: profile.languages ?? [],
      consultationModes: profile.consultation_modes ?? [],
      availability: profile.availability ?? "",
      biography: profile.biography ?? "",
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      clinicAddress: profile.clinic_address ?? "",
      linkedinUrl: profile.linkedin_url ?? "",
      portfolioUrl: profile.portfolio_url ?? "",
    });
    router.push("/consultant-onboarding/background");
  };

  const rows: [string, string][] = [
    ["Qualifications", profile.qualifications ?? "—"],
    ["Years of experience", profile.years_of_experience?.toString() ?? "—"],
    ["Current organization", profile.current_organization ?? "—"],
    ["Specializations", profile.specializations?.join(", ") || "—"],
    ["Languages", profile.languages?.join(", ") || "—"],
    ["Consultation modes", profile.consultation_modes?.join(", ") || "—"],
    ["Phone", profile.phone ?? "—"],
    ["Location", profile.location ?? "—"],
  ];

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-on-surface text-base font-semibold">Your profile</h2>
        <Button variant="outline" size="sm" onClick={editProfile}>
          Edit profile
        </Button>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-on-surface-variant font-geist text-[11px] font-semibold tracking-[0.05em] uppercase">
              {label}
            </dt>
            <dd className="text-on-surface font-sans text-sm break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DocumentsCard() {
  const queryClient = useQueryClient();
  const [documentType, setDocumentType] = useState<DocumentType>("professional_certificate");
  const [file, setFile] = useState<File | null>(null);

  const documentsQuery = useQuery({
    queryKey: ["consultant-profile", "me", "documents"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/consultant-profiles/me/documents");
      return data ?? [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const formData = new FormData();
      formData.append("document_type", documentType);
      formData.append("file", file);
      const { data, error } = await api.POST("/api/v1/consultant-profiles/me/documents", {
        // openapi-fetch passes FormData through untouched (no JSON serialization,
        // browser sets the multipart boundary itself).
        body: formData as unknown as never,
      });
      if (error) throw new Error("Upload failed");
      return data;
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["consultant-profile", "me", "documents"] });
    },
    onError: () => toast.error("Couldn't upload that document. Try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const { error } = await api.DELETE(
        "/api/v1/consultant-profiles/me/documents/{document_id}",
        { params: { path: { document_id: documentId } } }
      );
      if (error) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultant-profile", "me", "documents"] });
    },
    onError: () => toast.error("Couldn't remove that document. Try again."),
  });

  const documents: VerificationDocument[] = documentsQuery.data ?? [];

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6">
      <h2 className="font-heading text-on-surface text-base font-semibold">
        Verification documents
      </h2>

      {documentsQuery.isLoading ? (
        <Skeleton className="h-16 w-full rounded-lg" />
      ) : documents.length === 0 ? (
        <p className="text-on-surface-variant font-sans text-sm">No documents uploaded yet.</p>
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
                <span className="text-on-surface-variant font-sans text-xs">
                  ({DOCUMENT_TYPES.find((t) => t.value === doc.document_type)?.label})
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(doc.document_id)}
                disabled={deleteMutation.isPending}
                className="text-on-surface-variant hover:text-destructive"
                aria-label={`Remove ${doc.original_filename}`}
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <FieldGroup className="border-border flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
        <Field className="flex-1">
          <FieldLabel htmlFor="documentType" className={LABEL_CLASS}>
            Document type
          </FieldLabel>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            className="bg-muted text-on-surface focus:ring-secondary/40 w-full rounded-full border-none px-4 py-2.5 font-sans text-sm focus:ring-2 focus:outline-none"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field className="flex-1">
          <FieldLabel htmlFor="documentFile" className={LABEL_CLASS}>
            File
          </FieldLabel>
          <input
            id="documentFile"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-on-surface-variant font-sans text-sm"
          />
        </Field>
        <Button
          onClick={() => uploadMutation.mutate()}
          disabled={!file || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" strokeWidth={1.5} />
          )}
          Upload
        </Button>
      </FieldGroup>
    </div>
  );
}

export default function ConsultantDashboardPage() {
  const profileQuery = useQuery({
    queryKey: ["consultant-profile", "me"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/consultant-profiles/me");
      if (error) throw new Error("Failed to load profile");
      return data;
    },
  });

  if (profileQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <StateCard
        tone="destructive"
        icon={TriangleAlert}
        description="Couldn't load your profile."
        action={
          <Button variant="outline" onClick={() => profileQuery.refetch()}>
            <RotateCw className="size-4" strokeWidth={1.5} />
            Retry
          </Button>
        }
      />
    );
  }

  const profile = profileQuery.data;
  const status = STATUS_COPY[profile.verification_status];
  const isApproved = profile.verification_status === "approved";

  // Milestone 2 P5 (MILESTONE_2_UI_SPEC.md §4.2, docs/DECISIONS.md ADR-024): an
  // approved consultant gets the real clinical dashboard, not the verification
  // gate — the pending/rejected/etc. status banner + profile summary + document
  // upload stay exactly as they were for every other status.
  if (isApproved) {
    return <ClinicalDashboard role="consultant" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-border bg-card flex items-start gap-4 rounded-2xl border p-6">
        <div className={`rounded-full p-2.5 ${TONE_CLASSES[status.tone]}`}>
          <status.icon className="size-5" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-heading text-on-surface text-lg font-semibold">{status.title}</h1>
          <p className="text-on-surface-variant mt-1 font-sans text-sm">{status.body}</p>
          {profile.rejection_reason && (
            <p className="bg-muted text-on-surface mt-3 rounded-lg p-3 font-sans text-sm">
              <strong className="font-semibold">Reviewer note:</strong>{" "}
              {profile.rejection_reason}
            </p>
          )}
        </div>
      </div>

      <ProfileSummaryCard profile={profile} />

      <DocumentsCard />

      <div className="border-border bg-card flex items-center justify-between rounded-2xl border p-4">
        <div className="flex items-center gap-2">
          <Mail className="text-on-surface-variant size-4" strokeWidth={1.5} />
          <span className="text-on-surface-variant font-sans text-sm">
            Need help with your application?
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href="mailto:support@skinlytics.app">Contact support</a>}
        />
      </div>
    </div>
  );
}
