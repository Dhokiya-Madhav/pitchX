import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Star, MapPin, Clock, Car, Droplets, Lightbulb, Wifi, ShieldCheck,
  ChevronLeft, Shirt, Award,
} from "lucide-react";
import Navbar from "@/features/shell/components/Navbar";
import Footer from "@/features/shell/components/Footer";
import { fetchPublicGroundById } from "@/features/grounds/api/groundsApi";
import {
  fetchSlotsAsBookingSlots,
  slotsQueryKey,
} from "@/features/slots/api/slotsApi";
import { groundImageSrc } from "@/features/owner/api/ownerGroundsApi";
import { mockReviews } from "@/features/grounds/data/mockReviews";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  createBookingsForSlots,
  myBookingsQueryKey,
} from "@/features/bookings/api/bookingsApi";
import { slotSubtotalRupees } from "@/features/slots/slotPricing";

const facilityIcons: Record<string, React.ElementType> = {
  Floodlights: Lightbulb,
  Parking: Car,
  "Drinking Water": Droplets,
  "Changing Room": Shirt,
  Scoreboard: Award,
  Refreshments: ShieldCheck,
  "First Aid": ShieldCheck,
  Wifi: Wifi,
};

function groundDescription(g: { description?: string }): string {
  const d = g.description;
  return typeof d === "string" ? d.trim() : "";
}

const GroundDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token, user } = useAuth();

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const {
    data: ground,
    isPending: groundLoading,
    isError: groundError,
  } = useQuery({
    queryKey: ["public-ground", id],
    queryFn: () => fetchPublicGroundById(id!),
    enabled: Boolean(id),
  });

  const {
    data: slots = [],
    isPending: slotsLoading,
    isError: slotsError,
  } = useQuery({
    queryKey: slotsQueryKey(id ?? "", selectedDate),
    queryFn: () =>
      fetchSlotsAsBookingSlots(id!, selectedDate, ground?.pricePerHour ?? 0),
    enabled: Boolean(id && ground),
  });

  const reviews = useMemo(() => mockReviews.filter((r) => r.groundId === id), [id]);

  const groupedSlots = useMemo(
    () => ({
      Morning: slots.filter((s) => parseInt(s.startTime, 10) < 12),
      Afternoon: slots.filter(
        (s) =>
          parseInt(s.startTime, 10) >= 12 && parseInt(s.startTime, 10) < 17,
      ),
      Evening: slots.filter((s) => parseInt(s.startTime, 10) >= 17),
    }),
    [slots],
  );

  const hourlyRate = ground?.pricePerHour ?? 0;

  const totalPrice = useMemo(
    () =>
      selectedSlots.reduce((sum, sid) => {
        const s = slots.find((x) => x.id === sid);
        if (!s) return sum;
        return sum + slotSubtotalRupees({
          startTime: s.startTime,
          endTime: s.endTime,
          pricePerHour: hourlyRate,
        });
      }, 0),
    [selectedSlots, slots, hourlyRate],
  );

  const bookMutation = useMutation({
    mutationFn: (slotIds: string[]) => createBookingsForSlots(slotIds),
    onSuccess: (_data, slotIds) => {
      const sum = slotIds.reduce((acc, sid) => {
        const s = slots.find((x) => x.id === sid);
        if (!s) return acc;
        return acc + slotSubtotalRupees({
          startTime: s.startTime,
          endTime: s.endTime,
          pricePerHour: hourlyRate,
        });
      }, 0);
      toast({
        title: "Booking confirmed",
        description: `${slotIds.length} slot(s) booked. Pay ₹${sum} at the ground.`,
      });
      setSelectedSlots([]);
      if (id) {
        queryClient.invalidateQueries({ queryKey: slotsQueryKey(id, selectedDate) });
      }
      queryClient.invalidateQueries({ queryKey: myBookingsQueryKey });
    },
    onError: (err) => {
      toast({
        title: "Booking failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  if (!id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Invalid ground.</p>
      </div>
    );
  }

  if (groundLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading ground…</p>
      </div>
    );
  }

  if (groundError || !ground) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Ground not found.</p>
      </div>
    );
  }

  const toggleSlot = (slotId: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId) ? prev.filter((s) => s !== slotId) : [...prev, slotId]
    );
  };

  const handleBook = () => {
    if (selectedSlots.length === 0) return;
    if (user?.is_owner) {
      toast({
        title: "Booking not available",
        description: "Use a player account to book slots at grounds.",
        variant: "destructive",
      });
      return;
    }
    if (!token || !user) {
      navigate("/auth", { state: { from: `/grounds/${id}` } });
      return;
    }
    bookMutation.mutate([...selectedSlots]);
  };

  const handleReview = () => {
    if (rating === 0) return;
    toast({ title: "Review Submitted!", description: "Thanks for your feedback." });
    setRating(0);
    setReviewText("");
  };

  // Date options (next 7 days)
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return { day: d.toLocaleDateString("en", { weekday: "short" }), date: d.getDate() };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Image */}
      <div className="relative h-64 md:h-96">
        <img
          src={groundImageSrc(ground.image)}
          alt={ground.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm rounded-full p-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            {ground.isLive && (
              <span className="status-badge-live">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground animate-pulse-live" />
                LIVE
              </span>
            )}
          </div>
          <h1 className="font-display font-black text-2xl md:text-4xl text-primary-foreground">{ground.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-primary-foreground/70 text-sm">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{ground.address}</span>
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" />{ground.rating} ({ground.reviewCount})</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Facilities */}
            <div>
              <h2 className="font-display font-bold text-xl mb-4">Facilities</h2>
              {ground.facilities.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {ground.facilities.map((f) => {
                    const Icon = facilityIcons[f] || ShieldCheck;
                    return (
                      <div key={f} className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2.5 text-sm font-medium">
                        <Icon className="h-4 w-4 text-primary" />
                        {f}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {groundDescription(ground)
                    ? groundDescription(ground)
                    : "No facilities listed for this ground."}
                </p>
              )}
            </div>

            {/* Date Picker */}
            <div>
              <h2 className="font-display font-bold text-xl mb-4">Select Date</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dateOptions.map((d) => {
                  const { day, date } = formatDay(d);
                  return (
                    <button
                      key={d}
                      onClick={() => { setSelectedDate(d); setSelectedSlots([]); }}
                      className={`flex flex-col items-center min-w-[60px] px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        selectedDate === d
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span className="text-xs uppercase">{day}</span>
                      <span className="text-lg font-bold">{date}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot Grid */}
            <div>
              <h2 className="font-display font-bold text-xl mb-4">Available Slots</h2>
              {slotsLoading && (
                <p className="text-muted-foreground text-sm">Loading slots…</p>
              )}
              {slotsError && (
                <p className="text-destructive text-sm">
                  Could not load slots. Try again later.
                </p>
              )}
              {!slotsLoading && !slotsError && slots.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No slots available for this date.
                </p>
              )}
              {!slotsLoading &&
                !slotsError &&
                slots.length > 0 &&
                Object.entries(groupedSlots).map(
                  ([period, periodSlots]) =>
                    periodSlots.length > 0 && (
                      <div key={period} className="mb-6">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {period}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {periodSlots.map((slot) => (
                            <button
                              key={slot.id}
                              disabled={slot.status === "booked"}
                              onClick={() => toggleSlot(slot.id)}
                              className={
                                slot.status === "booked"
                                  ? "slot-chip-booked"
                                  : selectedSlots.includes(slot.id)
                                    ? "slot-chip-selected"
                                    : "slot-chip-available"
                              }
                            >
                              {slot.startTime} - {slot.endTime}
                            </button>
                          ))}
                        </div>
                      </div>
                    ),
                )}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="font-display font-bold text-xl mb-4">Reviews</h2>
              <div className="space-y-4 mb-6">
                {reviews.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet.</p>}
                {reviews.map((r) => (
                  <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{r.userName}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>

              {/* Add Review */}
              <div className="bg-muted rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3">Rate this ground</h3>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setRating(s)}>
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          s <= rating ? "fill-accent text-accent" : "text-border"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full bg-background border border-input rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button size="sm" className="mt-2" onClick={handleReview} disabled={rating === 0}>
                  Submit Review
                </Button>
              </div>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-display font-bold text-lg mb-1">Booking Summary</h3>
              <p className="text-muted-foreground text-sm mb-4">Pay at the ground</p>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ground</span>
                  <span className="font-medium">{ground.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Slots</span>
                  <span className="font-medium">{selectedSlots.length} selected</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-display font-bold">Total</span>
                  <span className="font-display font-bold text-primary text-xl">₹{totalPrice}</span>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                disabled={
                  selectedSlots.length === 0 ||
                  bookMutation.isPending ||
                  Boolean(user?.is_owner)
                }
                onClick={handleBook}
              >
                {bookMutation.isPending
                  ? "Booking…"
                  : user?.is_owner
                    ? "Player account required"
                    : !token
                      ? "Log in to book"
                      : "Confirm Booking"}
              </Button>
              {user?.is_owner && (
                <p className="text-xs text-amber-700 dark:text-amber-500 text-center mt-2">
                  Owners cannot book as players. Use a player account to reserve slots.
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center mt-3">
                No online payment required
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky booking bar */}
      {selectedSlots.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex items-center justify-between z-50 shadow-xl">
          <div>
            <div className="font-display font-bold text-lg text-primary">₹{totalPrice}</div>
            <div className="text-xs text-muted-foreground">{selectedSlots.length} slot(s)</div>
          </div>
          <Button
            variant="hero"
            onClick={handleBook}
            disabled={
              bookMutation.isPending ||
              Boolean(user?.is_owner)
            }
          >
            {bookMutation.isPending ? "Booking…" : user?.is_owner ? "Player only" : "Book Now"}
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default GroundDetailPage;
