import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OwnerShellLayout } from "@/features/owner/components/OwnerShellLayout";
import { useToast } from "@/hooks/use-toast";
import {
  getMyGroundById,
  updateGroundApi,
  readImageFileAsDataUrl,
  groundImageSrc,
  getCityIdFromGround,
  ownerGroundsQueryKey,
  ownerGroundDetailQueryKey,
} from "@/features/owner/api/ownerGroundsApi";
import { OWNER_CITY_OPTIONS } from "@/features/owner/data/ownerCities";

const OwnerEditGroundPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    cityId: "",
    address: "",
    pricePerHour: 0,
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewBlob, setPreviewBlob] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    data: ground,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ownerGroundDetailQueryKey(id ?? ""),
    queryFn: () => getMyGroundById(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!ground) return;
    setForm({
      name: ground.name,
      cityId: getCityIdFromGround(ground),
      address: ground.address,
      pricePerHour: ground.pricePerHour,
      description: ground.description ?? "",
    });
  }, [ground]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewBlob(null);
      return;
    }
    const u = URL.createObjectURL(imageFile);
    setPreviewBlob(u);
    return () => URL.revokeObjectURL(u);
  }, [imageFile]);

  const updateMutation = useMutation({
    mutationFn: (body: Parameters<typeof updateGroundApi>[1]) => updateGroundApi(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerGroundsQueryKey });
      if (id) queryClient.invalidateQueries({ queryKey: ownerGroundDetailQueryKey(id) });
      toast({ title: "Ground updated", description: "Changes saved successfully." });
      navigate("/owner/dashboard", { state: { tab: "grounds" } });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ground || !id) return;
    setSaving(true);
    try {
      let images: string[];
      if (imageFile) {
        images = [await readImageFileAsDataUrl(imageFile)];
      } else {
        const existing = ground._imageUrls?.[0]?.trim();
        if (!existing) {
          toast({
            title: "Image required",
            description: "Choose a ground photo (required).",
            variant: "destructive",
          });
          return;
        }
        images = [existing];
      }
      await updateMutation.mutateAsync({
        name: form.name.trim(),
        cityId: form.cityId || null,
        address: form.address.trim(),
        pricePerHour: form.pricePerHour,
        description: form.description.trim(),
        images,
      });
    } catch (err) {
      toast({
        title: "Could not save ground",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <OwnerShellLayout title="Edit ground" activeTab={null} onSelectTab={() => navigate("/owner/dashboard")}>
        <div className="p-4 lg:p-8">
          <p className="text-muted-foreground text-sm">Invalid ground.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/owner/dashboard" state={{ tab: "grounds" }}>
              Back
            </Link>
          </Button>
        </div>
      </OwnerShellLayout>
    );
  }

  return (
    <OwnerShellLayout
      title="Edit ground"
      activeTab={null}
      onSelectTab={(tab) => navigate("/owner/dashboard", { state: { tab } })}
    >
      <div className="p-4 lg:p-8 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link to="/owner/dashboard" state={{ tab: "grounds" }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Grounds
          </Link>
        </Button>

        {isPending && <p className="text-muted-foreground text-sm">Loading…</p>}
        {isError && (
          <div className="space-y-4">
            <p className="text-destructive text-sm">
              {error instanceof Error ? error.message : "Failed to load ground."}
            </p>
            <Button asChild variant="outline">
              <Link to="/owner/dashboard" state={{ tab: "grounds" }}>
                Back to dashboard
              </Link>
            </Button>
          </div>
        )}

        {ground && (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <Label>Ground photo</Label>
              <div className="mt-1.5 space-y-2">
                <img
                  src={previewBlob ?? groundImageSrc(ground._imageUrls[0] || ground.image)}
                  alt=""
                  className="max-h-48 w-full rounded-lg border border-border object-cover"
                />
                <Input
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
                {imageFile && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setImageFile(null)}>
                    Keep current photo
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Ground Name</Label>
              <Input
                className="mt-1.5"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>City</Label>
              <select
                className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                value={form.cityId}
                onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                required
              >
                <option value="">Select city</option>
                {OWNER_CITY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                className="mt-1.5"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Price per Hour (₹)</Label>
              <Input
                type="number"
                min={0}
                className="mt-1.5"
                value={form.pricePerHour || ""}
                onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1.5 min-h-[80px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Button type="submit" variant="hero" disabled={saving || updateMutation.isPending}>
              {saving || updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        )}
      </div>
    </OwnerShellLayout>
  );
};

export default OwnerEditGroundPage;
