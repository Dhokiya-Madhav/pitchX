import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin, Plus,
  Star,
  Pencil, Trash2, IndianRupee, Clock,
} from "lucide-react";
import { OwnerShellLayout, type OwnerShellTab } from "@/features/owner/components/OwnerShellLayout";
import {
  createSlotApi,
  deleteSlotApi,
  listSlotsForGround,
  slotsQueryKey,
  updateSlotApi,
  type OwnerSlotView,
} from "@/features/slots/api/slotsApi";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listMyGrounds,
  createGroundApi,
  deleteGroundApi,
  groundImageSrc,
  readImageFileAsDataUrl,
  ownerGroundsQueryKey,
  type OwnerGround,
} from "@/features/owner/api/ownerGroundsApi";
import { OWNER_CITY_OPTIONS } from "@/features/owner/data/ownerCities";
import {
  cancelBooking,
  fetchOwnerBookings,
  fetchOwnerDashboardStats,
  ownerBookingsQueryKey,
  ownerDashboardStatsQueryKey,
  type OwnerBookingListItem,
} from "@/features/bookings/api/bookingsApi";

const OwnerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tabFromState = (location.state as { tab?: OwnerShellTab } | null)?.tab;
  const [activeTab, setActiveTab] = useState<OwnerShellTab>(tabFromState ?? "dashboard");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: ownerGrounds = [],
    isPending: groundsLoading,
    isError: groundsError,
    error: groundsQueryError,
    refetch: refetchGrounds,
  } = useQuery({
    queryKey: ownerGroundsQueryKey,
    queryFn: listMyGrounds,
  });

  const [revenueGroundSearch, setRevenueGroundSearch] = useState("");
  const [bookingListGroundId, setBookingListGroundId] = useState("");
  const [bookingListDate, setBookingListDate] = useState("");
  const [cancelBookingTarget, setCancelBookingTarget] =
    useState<OwnerBookingListItem | null>(null);

  const bookingListFilters = useMemo(
    () => ({
      groundId: bookingListGroundId || undefined,
      date: bookingListDate || undefined,
    }),
    [bookingListGroundId, bookingListDate],
  );

  const {
    data: ownerStats,
    isPending: ownerStatsLoading,
    isError: ownerStatsError,
    error: ownerStatsQueryError,
    refetch: refetchOwnerStats,
  } = useQuery({
    queryKey: ownerDashboardStatsQueryKey,
    queryFn: fetchOwnerDashboardStats,
  });

  const {
    data: ownerBookingsAll = [],
    isPending: ownerBookingsAllLoading,
    isError: ownerBookingsAllError,
    error: ownerBookingsAllQueryError,
    refetch: refetchOwnerBookingsAll,
  } = useQuery({
    queryKey: ownerBookingsQueryKey({}),
    queryFn: () => fetchOwnerBookings({}),
  });

  const {
    data: ownerBookingsList = [],
    isPending: ownerBookingsLoading,
    isError: ownerBookingsError,
    error: ownerBookingsQueryError,
    refetch: refetchOwnerBookings,
  } = useQuery({
    queryKey: ownerBookingsQueryKey(bookingListFilters),
    queryFn: () => fetchOwnerBookings(bookingListFilters),
  });

  const revenueByGroundMap = useMemo(() => {
    const m = new Map<string, { revenue: number; bookingCount: number }>();
    ownerStats?.revenueByGround.forEach((r) => {
      m.set(r.groundId, { revenue: r.revenue, bookingCount: r.bookingCount });
    });
    return m;
  }, [ownerStats]);

  const getGroundRevenue = (groundId: string) => {
    const hit = revenueByGroundMap.get(groundId);
    return { total: hit?.revenue ?? 0, bookingCount: hit?.bookingCount ?? 0 };
  };

  const [deleteGroundId, setDeleteGroundId] = useState<string | null>(null);

  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [addFileInputKey, setAddFileInputKey] = useState(0);
  const [addGroundBusy, setAddGroundBusy] = useState(false);

  const [addForm, setAddForm] = useState({
    name: "",
    cityId: OWNER_CITY_OPTIONS[0]?.id ?? "",
    address: "",
    pricePerHour: 0,
    description: "",
  });

  const [selectedGroundForSlots, setSelectedGroundForSlots] = useState<string>("");
  const today = new Date().toISOString().split("T")[0];
  const [slotDate, setSlotDate] = useState(today);
  const [slotForm, setSlotForm] = useState({ startTime: "", endTime: "" });
  const [editSlot, setEditSlot] = useState<OwnerSlotView | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);

  const {
    data: slotsForGround = [],
    isPending: slotsLoading,
    isError: slotsError,
    error: slotsQueryError,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: slotsQueryKey(selectedGroundForSlots, slotDate),
    queryFn: () => listSlotsForGround(selectedGroundForSlots, slotDate),
    enabled: Boolean(selectedGroundForSlots),
  });

  useEffect(() => {
    if (!addImageFile) {
      setAddImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(addImageFile);
    setAddImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [addImageFile]);

  const createMutation = useMutation({
    mutationFn: createGroundApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerGroundsQueryKey });
      toast({ title: "Ground added", description: "Your ground is now listed." });
      setActiveTab("grounds");
      setAddForm({
        name: "",
        cityId: OWNER_CITY_OPTIONS[0]?.id ?? "",
        address: "",
        pricePerHour: 0,
        description: "",
      });
      setAddImageFile(null);
      setAddFileInputKey((k) => k + 1);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGroundApi,
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ownerGroundsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      setDeleteGroundId(null);
      if (selectedGroundForSlots === deletedId) {
        setSelectedGroundForSlots("");
      }
      toast({ title: "Ground deleted", description: "The ground has been removed." });
    },
    onError: (err) => {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = () => {
    if (!deleteGroundId) return;
    deleteMutation.mutate(deleteGroundId);
  };

  const handleAddGround = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast({ title: "Name required", description: "Enter a ground name.", variant: "destructive" });
      return;
    }
    if (!addForm.cityId) {
      toast({ title: "City required", description: "Select a city.", variant: "destructive" });
      return;
    }
    if (!addImageFile) {
      toast({
        title: "Image required",
        description: "Choose one ground photo.",
        variant: "destructive",
      });
      return;
    }
    setAddGroundBusy(true);
    try {
      const imageUrl = await readImageFileAsDataUrl(addImageFile);
      await createMutation.mutateAsync({
        name: addForm.name.trim(),
        city_id: addForm.cityId,
        address: addForm.address.trim(),
        pricePerHour: addForm.pricePerHour > 0 ? addForm.pricePerHour : 0,
        description: addForm.description.trim(),
        images: [imageUrl],
      });
    } catch (err) {
      toast({
        title: "Could not add ground",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setAddGroundBusy(false);
    }
  };

  const createSlotMutation = useMutation({
    mutationFn: createSlotApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      toast({ title: "Slot Added!", description: "Slot created for this date." });
      setSlotForm({ startTime: "", endTime: "" });
    },
    onError: (err) => {
      toast({
        title: "Could not add slot",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { date: string; startTime: string; endTime: string };
    }) => updateSlotApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      setEditSlot(null);
      toast({ title: "Slot Updated!", description: "Changes saved." });
    },
    onError: (err) => {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: deleteSlotApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      setDeleteSlotId(null);
      toast({ title: "Slot Deleted", description: "The slot has been removed." });
    },
    onError: (err) => {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
      queryClient.invalidateQueries({ queryKey: ownerDashboardStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      setCancelBookingTarget(null);
      toast({ title: "Booking cancelled", description: "The slot is available again." });
    },
    onError: (err) => {
      toast({
        title: "Could not cancel",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmCancelBooking = () => {
    if (!cancelBookingTarget) return;
    cancelBookingMutation.mutate(cancelBookingTarget.bookingId);
  };

  const handleAddSlot = () => {
    if (!selectedGroundForSlots || !slotForm.startTime || !slotForm.endTime) {
      toast({
        title: "Fill all fields",
        description: "Choose date, start time, and end time.",
        variant: "destructive",
      });
      return;
    }
    createSlotMutation.mutate({
      groundId: selectedGroundForSlots,
      date: slotDate,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
    });
  };

  const handleSaveSlotEdit = () => {
    if (!editSlot) return;
    updateSlotMutation.mutate({
      id: editSlot.id,
      body: {
        date: editSlot.date,
        startTime: editSlot.startTime,
        endTime: editSlot.endTime,
      },
    });
  };

  const handleDeleteSlot = () => {
    if (!deleteSlotId) return;
    deleteSlotMutation.mutate(deleteSlotId);
  };

  const headerTitle = activeTab === "add-ground" ? "Add Ground" : activeTab;

  const groundsBlockers = groundsLoading ? (
    <p className="text-muted-foreground text-sm py-8 text-center">Loading grounds…</p>
  ) : groundsError ? (
    <div className="text-center py-8 space-y-2">
      <p className="text-destructive text-sm">
        {groundsQueryError instanceof Error ? groundsQueryError.message : "Failed to load grounds."}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={() => refetchGrounds()}>
        Retry
      </Button>
    </div>
  ) : null;

  const statsBlockers = ownerStatsLoading ? (
    <p className="text-muted-foreground text-sm py-4 text-center">Loading stats…</p>
  ) : ownerStatsError ? (
    <div className="text-center py-4 space-y-2">
      <p className="text-destructive text-sm">
        {ownerStatsQueryError instanceof Error ? ownerStatsQueryError.message : "Failed to load stats."}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={() => refetchOwnerStats()}>
        Retry
      </Button>
    </div>
  ) : null;

  const filteredGroundsForRevenue = useMemo(() => {
    const q = revenueGroundSearch.trim().toLowerCase();
    if (!q) return ownerGrounds;
    return ownerGrounds.filter((g) => g.name.toLowerCase().includes(q));
  }, [ownerGrounds, revenueGroundSearch]);

  const dashboardRecentBookings = useMemo(
    () => ownerBookingsAll.slice(0, 5),
    [ownerBookingsAll],
  );

  return (
    <OwnerShellLayout title={headerTitle} activeTab={activeTab} onSelectTab={setActiveTab}>
      <div className="p-4 lg:p-8">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {groundsBlockers}
            {statsBlockers}
            {!groundsLoading && !groundsError && !ownerStatsLoading && !ownerStatsError && ownerStats && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Grounds",
                      value: ownerStats.totalGrounds,
                      color: "text-primary",
                    },
                    {
                      label: "Total Bookings",
                      value: ownerStats.totalBookings,
                      color: "text-secondary",
                    },
                    {
                      label: "Active Slots",
                      value: ownerStats.activeSlots,
                      color: "text-primary",
                    },
                    {
                      label: "Total Revenue",
                      value: `₹${ownerStats.revenue.toLocaleString()}`,
                      color: "text-accent",
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className={`font-display font-black text-2xl mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    Revenue by Ground
                  </h2>
                  {ownerGrounds.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No grounds yet. Add a ground to see revenue here.</p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="revenue-ground-search" className="sr-only">
                          Search grounds
                        </Label>
                        <Input
                          id="revenue-ground-search"
                          placeholder="Search by ground name…"
                          value={revenueGroundSearch}
                          onChange={(e) => setRevenueGroundSearch(e.target.value)}
                          className="max-w-md"
                        />
                      </div>
                      {filteredGroundsForRevenue.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No grounds match your search.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredGroundsForRevenue.map((g) => {
                            const rev = getGroundRevenue(g.id);
                            return (
                              <div key={g.id} className="bg-card border border-border rounded-xl p-5">
                                <h3 className="font-semibold text-sm truncate">{g.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{rev.bookingCount} active booking(s)</p>
                                <p className="font-display font-black text-xl text-primary mt-2">
                                  ₹{rev.total.toLocaleString()}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-display font-bold text-lg mb-4">Recent Bookings</h2>
                  {ownerBookingsAllLoading ? (
                    <p className="text-muted-foreground text-sm py-6 text-center">Loading bookings…</p>
                  ) : ownerBookingsAllError ? (
                    <div className="text-center py-6 space-y-2">
                      <p className="text-destructive text-sm">
                        {ownerBookingsAllQueryError instanceof Error
                          ? ownerBookingsAllQueryError.message
                          : "Failed to load bookings."}
                      </p>
                      <Button type="button" variant="outline" size="sm" onClick={() => refetchOwnerBookingsAll()}>
                        Retry
                      </Button>
                    </div>
                  ) : dashboardRecentBookings.length === 0 ? (
                    <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center text-muted-foreground text-sm">
                      No bookings yet. When players book your grounds, they will appear here.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboardRecentBookings.map((b) => (
                        <div
                          key={b.bookingId}
                          className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-semibold text-sm">{b.groundName}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.userName} • {b.date} • {b.startTime} - {b.endTime}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              ₹{b.amountRupees.toLocaleString()} • {b.status}
                            </p>
                          </div>
                          <span
                            className={
                              b.status === "CANCELLED"
                                ? "text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-muted text-muted-foreground shrink-0"
                                : "text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-primary/10 text-primary shrink-0"
                            }
                          >
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "grounds" && (
          <div>
            {groundsBlockers}
            {!groundsLoading && !groundsError && ownerGrounds.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
                <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm max-w-sm mb-4">You have not added any grounds yet.</p>
                <Button type="button" onClick={() => setActiveTab("add-ground")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first ground
                </Button>
              </div>
            )}
            {!groundsLoading && !groundsError && ownerGrounds.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ownerGrounds.map((g) => {
                  const rev = getGroundRevenue(g.id);
                  return (
                    <div key={g.id} className="bg-card border border-border rounded-xl overflow-hidden">
                      <img src={groundImageSrc(g.image)} alt={g.name} className="w-full h-48 object-cover" />
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-display font-bold text-lg">{g.name}</h3>
                            <p className="text-sm text-muted-foreground">{g.address}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="font-semibold text-sm">{Number(g.rating).toFixed(1)}</span>
                          </div>
                        </div>
                        {g.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {g.facilities.map((f) => (
                              <span key={f} className="bg-muted text-xs font-medium px-2.5 py-1 rounded-full">{f}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-4">
                          <div>
                            <p className="font-display font-bold text-primary">₹{g.pricePerHour}/hr</p>
                            <p className="text-xs text-muted-foreground">Revenue: ₹{rev.total.toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/owner/grounds/${g.id}/edit`)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setDeleteGroundId(g.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "slots" && (
          <div>
            {ownerGrounds.length === 0 && !groundsLoading && !groundsError && (
              <div className="mb-6 bg-muted/50 border border-border rounded-xl p-6 text-center text-sm text-muted-foreground">
                Add at least one ground before managing slots.
              </div>
            )}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1">
                <Label>Select Ground</Label>
                <select
                  value={selectedGroundForSlots}
                  onChange={(e) => setSelectedGroundForSlots(e.target.value)}
                  className="mt-1.5 w-full sm:w-72 h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={ownerGrounds.length === 0}
                >
                  <option value="">Choose a ground</option>
                  {ownerGrounds.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Slot date</Label>
                <Input
                  type="date"
                  className="mt-1.5 w-full sm:w-44"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  disabled={!selectedGroundForSlots}
                />
              </div>
            </div>

            {selectedGroundForSlots && (
              <>
                <div className="bg-card border border-border rounded-xl p-5 mb-6">
                  <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add slot for {slotDate}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Rate for this slot is the ground&apos;s price per hour (₹
                    {ownerGrounds.find((g) => g.id === selectedGroundForSlots)?.pricePerHour ?? "—"}
                    /hr).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <Label className="text-xs">Start Time</Label>
                      <Input
                        type="time"
                        className="mt-1"
                        value={slotForm.startTime}
                        onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Time</Label>
                      <Input
                        type="time"
                        className="mt-1"
                        value={slotForm.endTime}
                        onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={handleAddSlot}
                      disabled={createSlotMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" /> {createSlotMutation.isPending ? "Adding…" : "Add Slot"}
                    </Button>
                  </div>
                </div>

                <h3 className="font-display font-bold text-base mb-3">Slots for this date</h3>
                {slotsLoading && (
                  <p className="text-muted-foreground text-sm mb-6">Loading slots…</p>
                )}
                {slotsError && (
                  <div className="mb-6 space-y-2">
                    <p className="text-destructive text-sm">
                      {slotsQueryError instanceof Error ? slotsQueryError.message : "Failed to load slots."}
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={() => refetchSlots()}>
                      Retry
                    </Button>
                  </div>
                )}
                {!slotsLoading && !slotsError && slotsForGround.length === 0 && (
                  <p className="text-muted-foreground text-sm mb-6">
                    No slots for this date. Add times above—they are stored for this ground only.
                  </p>
                )}
                {!slotsLoading && !slotsError && slotsForGround.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {slotsForGround.map((s) => (
                      <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {s.startTime} – {s.endTime}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ₹{s.price}/hr{s.isBooked ? " • Booked" : ""}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditSlot({ ...s })}
                            disabled={s.isBooked}
                            title={s.isBooked ? "Cannot edit a booked slot" : "Edit"}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteSlotId(s.id)}
                            disabled={s.isBooked}
                            title={s.isBooked ? "Cannot delete a booked slot" : "Delete"}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1">
                <Label>Ground</Label>
                <select
                  value={bookingListGroundId}
                  onChange={(e) => setBookingListGroundId(e.target.value)}
                  className="mt-1.5 w-full sm:max-w-md h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All grounds</option>
                  {ownerGrounds.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Slot date</Label>
                <Input
                  type="date"
                  className="mt-1.5 w-full sm:w-44"
                  value={bookingListDate}
                  onChange={(e) => setBookingListDate(e.target.value)}
                />
              </div>
            </div>
            {ownerBookingsLoading ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Loading bookings…</p>
            ) : ownerBookingsError ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-destructive text-sm">
                  {ownerBookingsQueryError instanceof Error
                    ? ownerBookingsQueryError.message
                    : "Failed to load bookings."}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => refetchOwnerBookings()}>
                  Retry
                </Button>
              </div>
            ) : ownerBookingsList.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
                {!bookingListGroundId && !bookingListDate
                  ? "No bookings yet."
                  : "No bookings match these filters."}
              </div>
            ) : (
              <div className="space-y-3">
                {ownerBookingsList.map((b) => (
                  <div
                    key={b.bookingId}
                    className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h3 className="font-semibold">{b.groundName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {b.userName}
                        {b.userPhone ? ` • ${b.userPhone}` : ""} • {b.date}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {b.startTime} - {b.endTime} • ₹{b.amountRupees.toLocaleString()} • Pay at ground
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                      <span
                        className={
                          b.status === "CANCELLED"
                            ? "text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-muted text-muted-foreground"
                            : "text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-primary/10 text-primary"
                        }
                      >
                        {b.status}
                      </span>
                      {b.status === "BOOKED" && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancelBookingTarget(b)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "add-ground" && (
          <form onSubmit={handleAddGround} className="max-w-2xl space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Ground Name</Label>
                <Input
                  placeholder="e.g., StrikeZone Arena"
                  className="mt-1.5"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>City</Label>
                <select
                  className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                  value={addForm.cityId}
                  onChange={(e) => setAddForm({ ...addForm, cityId: e.target.value })}
                  required
                >
                  <option value="">Select city</option>
                  {OWNER_CITY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Full Address</Label>
              <Input
                placeholder="Street address, area"
                className="mt-1.5"
                value={addForm.address}
                onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Price per Hour (₹)</Label>
              <Input
                type="number"
                min={0}
                placeholder="1200"
                className="mt-1.5"
                value={addForm.pricePerHour || ""}
                onChange={(e) => setAddForm({ ...addForm, pricePerHour: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                className="mt-1.5 min-h-[80px]"
                placeholder="Pitch type, amenities…"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Ground photo (required)</Label>
              <Input
                key={addFileInputKey}
                type="file"
                accept="image/*"
                className="mt-1.5 cursor-pointer"
                onChange={(e) => setAddImageFile(e.target.files?.[0] ?? null)}
              />
              {addImagePreview && (
                <div className="mt-3 space-y-2">
                  <img
                    src={addImagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-lg border border-border object-cover"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setAddImageFile(null)}>
                    Remove image
                  </Button>
                </div>
              )}
            </div>
            <Button variant="hero" size="lg" type="submit" disabled={addGroundBusy || createMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {addGroundBusy || createMutation.isPending ? "Adding…" : "Add Ground"}
            </Button>
          </form>
        )}
      </div>

      <AlertDialog open={!!deleteGroundId} onOpenChange={(open) => !open && setDeleteGroundId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ground</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ground? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editSlot} onOpenChange={(open) => !open && setEditSlot(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Slot</DialogTitle>
          </DialogHeader>
          {editSlot && (
            <div className="space-y-4 py-2">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={editSlot.date}
                  onChange={(e) => setEditSlot({ ...editSlot, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input type="time" className="mt-1.5" value={editSlot.startTime} onChange={(e) => setEditSlot({ ...editSlot, startTime: e.target.value })} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" className="mt-1.5" value={editSlot.endTime} onChange={(e) => setEditSlot({ ...editSlot, endTime: e.target.value })} />
              </div>
              <p className="text-xs text-muted-foreground">
                Billing uses this ground&apos;s price per hour (₹{editSlot.price}/hr). Change it under Edit ground.
              </p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveSlotEdit} disabled={updateSlotMutation.isPending}>
              {updateSlotMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSlotId} onOpenChange={(open) => !open && setDeleteSlotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this slot?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSlot}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSlotMutation.isPending}
            >
              {deleteSlotMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!cancelBookingTarget}
        onOpenChange={(open) => !open && setCancelBookingTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelBookingTarget
                ? `${cancelBookingTarget.groundName} • ${cancelBookingTarget.date} ${cancelBookingTarget.startTime}–${cancelBookingTarget.endTime} for ${cancelBookingTarget.userName}. This frees the slot for other players.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancelBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelBookingMutation.isPending}
            >
              {cancelBookingMutation.isPending ? "Cancelling…" : "Cancel booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OwnerShellLayout>
  );
};

export default OwnerDashboard;
