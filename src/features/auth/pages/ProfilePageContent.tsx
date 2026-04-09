import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getProfile,
  profileToAuthUser,
  updateProfile,
  type UpdateProfileBody,
} from "@/features/auth/api/authApi";
import { useAuth } from "@/features/auth/context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProfilePageContent() {
  const queryClient = useQueryClient();
  const { token, updateUser } = useAuth();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: Boolean(token),
  });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!data) return;
    updateUser(profileToAuthUser(data));
  }, [data, updateUser]);

  useEffect(() => {
    if (!data || editing) return;
    setName(data.name);
    setPhone(data.phone ?? "");
    setEmail(data.email ?? "");
  }, [data, editing]);

  const startEdit = () => {
    if (!data) return;
    setName(data.name);
    setPhone(data.phone ?? "");
    setEmail(data.email ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    if (data) {
      setName(data.name);
      setPhone(data.phone ?? "");
      setEmail(data.email ?? "");
    }
  };

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      updateUser(profileToAuthUser(updated));
      toast.success("Profile updated");
      setEditing(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Update failed");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmedEmail)) {
      toast.error("Enter a valid email");
      return;
    }
    const body: UpdateProfileBody = {
      name: trimmedName,
      phone: phone.trim(),
    };
    if (data && trimmedEmail !== String(data.email).trim().toLowerCase()) {
      body.email = trimmedEmail;
    }
    mutation.mutate(body);
  };

  return (
    <>
      {isPending && (
        <p className="text-muted-foreground text-sm">Loading your profile…</p>
      )}
      {isError && (
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : "Something went wrong"}
        </p>
      )}
      {data && (
        <div className="space-y-8">
          <div className="max-w-lg bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {!editing ? (
                  <span className="font-display font-bold text-lg">{data.name}</span>
                ) : null}
                <Badge variant={data.is_owner ? "default" : "secondary"}>
                  {data.is_owner ? "Ground owner" : "Player"}
                </Badge>
              </div>
              {!editing ? (
                <Button type="button" variant="outline" size="sm" onClick={startEdit}>
                  Edit profile
                </Button>
              ) : null}
            </div>

            <dl className="space-y-3 text-sm">
              {!editing ? (
                <>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium">{data.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{data.phone || "—"}</dd>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSave} className="space-y-4 pt-1">
                  <div>
                    <Label htmlFor="profile-name">Name</Label>
                    <Input
                      id="profile-name"
                      className="mt-1.5"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      className="mt-1.5"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-phone">Phone</Label>
                    <Input
                      id="profile-phone"
                      className="mt-1.5"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving…" : "Save changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={mutation.isPending}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
