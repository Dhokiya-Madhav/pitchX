import { useMemo, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/features/shell/components/Navbar";
import Footer from "@/features/shell/components/Footer";
import GroundCard from "@/features/grounds/components/GroundCard";
import { fetchPublicGrounds } from "@/features/grounds/api/groundsApi";
import { PLAYER_CITY_OPTIONS } from "@/shared/data/playerCities";
import { motion } from "framer-motion";

const GroundsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCityId = searchParams.get("cityId") || "";
  const [cityId, setCityId] = useState(urlCityId);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setCityId(urlCityId);
  }, [urlCityId]);

  const {
    data: grounds = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["public-grounds", "browse", cityId || "all"],
    queryFn: () => fetchPublicGrounds(cityId ? { cityId } : undefined),
  });

  const onCityChange = (next: string) => {
    setCityId(next);
    const nextParams = new URLSearchParams(searchParams);
    if (next) nextParams.set("cityId", next);
    else nextParams.delete("cityId");
    setSearchParams(nextParams, { replace: true });
  };

  const filtered = useMemo(() => {
    return grounds.filter((g) => {
      const matchSearch =
        !searchQuery ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [grounds, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="section-heading mb-6">Browse Grounds</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={cityId}
              onChange={(e) => onCityChange(e.target.value)}
              className="h-10 pl-10 pr-8 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="">All Cities</option>
              {PLAYER_CITY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isPending && (
          <p className="text-muted-foreground text-center py-20">Loading grounds…</p>
        )}
        {isError && (
          <div className="text-center py-20 space-y-2">
            <p className="text-destructive text-sm">
              {error instanceof Error ? error.message : "Failed to load grounds."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}
        {!isPending && !isError && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No grounds found. Try a different city or search term.</p>
          </div>
        )}
        {!isPending && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ground, i) => (
              <motion.div
                key={ground.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <GroundCard ground={ground} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default GroundsPage;
