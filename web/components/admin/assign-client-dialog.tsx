"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface PickerUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
}

// bugs_report.md 2026-07-26, bug #5 — the Consultant topbar's "Add New Client" button
// linked to a page a consultant has no way to act on (clients are admin-assigned
// only, per consultant_clients' own schema). Backend already had a working, audited
// POST /api/v1/admin/consultant-clients with two comments calling this exact UI "a
// deliberate follow-up, not built this pass" (admin/router.py:207, admin/service.py:
// 214) — this closes that loop instead of just hiding the broken button.
function usePickerUsers(roleParam: string, search: string) {
  const deferredSearch = useDeferredValue(search);
  return useQuery({
    queryKey: ["admin", "users", "picker", roleParam, deferredSearch],
    queryFn: async (): Promise<PickerUser[]> => {
      const params = new URLSearchParams({ role: roleParam, limit: "20" });
      if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to load users");
      const data = await response.json();
      return data.users.map(
        (u: { id: string; name: string; email: string; role: string | null }) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
        })
      );
    },
  });
}

export function AssignClientDialog() {
  const [open, setOpen] = useState(false);
  const [professionalSearch, setProfessionalSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [professional, setProfessional] = useState<PickerUser | null>(null);
  const [client, setClient] = useState<PickerUser | null>(null);
  const queryClient = useQueryClient();

  const professionalsQuery = usePickerUsers("consultant,dermatologist", professionalSearch);
  const clientsQuery = usePickerUsers("user", clientSearch);

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!professional || !client) throw new Error("Pick both a professional and a client");
      const { error } = await api.POST("/api/v1/admin/consultant-clients", {
        body: { professional_id: professional.id, user_id: client.id },
      });
      if (error) throw new Error("Failed to assign client");
    },
    onSuccess: () => {
      toast.success("Client assigned");
      setOpen(false);
      setProfessional(null);
      setClient(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
    onError: () => toast.error("Couldn't assign that client. Please try again."),
  });

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" strokeWidth={1.5} />
        Assign client
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a client</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Consultant or dermatologist</Label>
              <Combobox
                items={professionalsQuery.data ?? []}
                value={professional}
                onValueChange={setProfessional}
                inputValue={professionalSearch}
                onInputValueChange={setProfessionalSearch}
                itemToStringLabel={(item: PickerUser) => `${item.name} — ${item.email}`}
                isItemEqualToValue={(a: PickerUser, b: PickerUser) => a.id === b.id}
              >
                <ComboboxInput placeholder="Search by email..." />
                <ComboboxContent>
                  <ComboboxEmpty>No professionals found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item: PickerUser) => (
                      <ComboboxItem key={item.id} value={item}>
                        {item.name} — {item.email} ({item.role})
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Client</Label>
              <Combobox
                items={clientsQuery.data ?? []}
                value={client}
                onValueChange={setClient}
                inputValue={clientSearch}
                onInputValueChange={setClientSearch}
                itemToStringLabel={(item: PickerUser) => `${item.name} — ${item.email}`}
                isItemEqualToValue={(a: PickerUser, b: PickerUser) => a.id === b.id}
              >
                <ComboboxInput placeholder="Search by email..." />
                <ComboboxContent>
                  <ComboboxEmpty>No users found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item: PickerUser) => (
                      <ComboboxItem key={item.id} value={item}>
                        {item.name} — {item.email}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <Button
              onClick={() => assignMutation.mutate()}
              disabled={!professional || !client || assignMutation.isPending}
            >
              {assignMutation.isPending && (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
              )}
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
