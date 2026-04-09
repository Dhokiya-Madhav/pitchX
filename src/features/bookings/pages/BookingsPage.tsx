import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Navbar from "@/features/shell/components/Navbar";
import Footer from "@/features/shell/components/Footer";
import { Calendar, Clock, MapPin } from "lucide-react";
import {
  fetchMyBookings,
  myBookingsQueryKey,
} from "@/features/bookings/api/bookingsApi";
import { useAuth } from "@/features/auth/context/AuthContext";

const BookingsPage = () => {
  const { token } = useAuth();
  const {
    data: bookings = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: myBookingsQueryKey,
    queryFn: fetchMyBookings,
    enabled: Boolean(token),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="section-heading mb-6">My Bookings</h1>

        {isPending && (
          <p className="text-muted-foreground text-sm py-12 text-center">Loading bookings…</p>
        )}
        {isError && (
          <div className="text-center py-12 space-y-3">
            <p className="text-destructive text-sm">
              {error instanceof Error ? error.message : "Could not load bookings."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}
        {!isPending && !isError && bookings.length === 0 && (
          <p className="text-muted-foreground text-center py-20">
            No bookings yet. Browse grounds and book a slot to see it here.
          </p>
        )}
        {!isPending && !isError && bookings.length > 0 && (
          <ul className="space-y-4">
            {bookings.map((b) => (
              <li
                key={b.bookingId}
                className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex-1 space-y-2">
                  <p className="font-display font-bold text-base">{b.groundName}</p>
                  <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{b.groundAddress || "—"}</span>
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {b.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {b.startTime} – {b.endTime}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Payment: Pay at ground</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                  <span
                    className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full ${
                      b.status === "BOOKED"
                        ? "bg-primary/10 text-primary"
                        : b.status === "CANCELLED"
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted text-foreground"
                    }`}
                  >
                    {b.status.toLowerCase()}
                  </span>
                  <span className="font-display font-bold text-lg text-primary">
                    ₹{Math.round(b.amountRupees).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BookingsPage;
