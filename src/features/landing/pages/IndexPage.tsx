import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, ChevronRight, Shield, Zap } from "lucide-react";
import Navbar from "@/features/shell/components/Navbar";
import Footer from "@/features/shell/components/Footer";
import GroundCard from "@/features/grounds/components/GroundCard";
import { fetchPublicGrounds } from "@/features/grounds/api/groundsApi";
import { PLAYER_CITY_OPTIONS } from "@/shared/data/playerCities";
import heroImage from "@/assets/hero-cricket.jpg";

const IndexPage = () => {
  const [selectedCityId, setSelectedCityId] = useState("");
  const navigate = useNavigate();

  const { data: featuredGrounds = [], isPending, isError } = useQuery({
    queryKey: ["public-grounds", "featured"],
    queryFn: () => fetchPublicGrounds({ limit: 3 }),
  });

  const handleSearch = () => {
    const q = selectedCityId ? `?cityId=${encodeURIComponent(selectedCityId)}` : "";
    navigate(`/grounds${q}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Sports Ground" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/40" />
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="status-badge-live mb-4 inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground animate-pulse-live" />
              LIVE GROUNDS AVAILABLE
            </span>
            <h1 className="font-display font-black text-4xl md:text-6xl text-primary-foreground leading-tight mb-4">
              Book Your Sports Slot{" "}
              <span className="text-accent">Instantly</span>
            </h1>
            <p className="text-primary-foreground/70 text-lg md:text-xl mb-8 leading-relaxed">
              Discover premium sports grounds near you. Pick a slot, pay at the ground, and play!
            </p>

            {/* Search Bar */}
            <div className="bg-card rounded-xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 bg-transparent border-0 text-foreground font-medium focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">All Cities</option>
                  {PLAYER_CITY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleSearch} variant="hero" size="lg" className="h-12 px-8">
                <Search className="h-5 w-5 mr-2" />
                Find Grounds
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "500+", label: "Grounds" },
              { value: "50K+", label: "Bookings" },
              { value: "8", label: "Cities" },
              { value: "4.7★", label: "Avg Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display font-black text-2xl md:text-3xl text-primary">{stat.value}</div>
                <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Grounds */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-heading">Top Rated Grounds</h2>
            <p className="text-muted-foreground mt-2">Handpicked grounds loved by players</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/grounds")} className="hidden md:flex">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        {isPending && (
          <p className="text-muted-foreground text-sm">Loading grounds…</p>
        )}
        {isError && (
          <p className="text-destructive text-sm">Could not load grounds. Try again later.</p>
        )}
        {!isPending && !isError && featuredGrounds.length === 0 && (
          <p className="text-muted-foreground text-sm">No grounds listed yet. Check back soon.</p>
        )}
        {!isPending && !isError && featuredGrounds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGrounds.map((ground) => (
              <motion.div
                key={ground.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <GroundCard ground={ground} />
              </motion.div>
            ))}
          </div>
        )}
        <div className="mt-6 text-center md:hidden">
          <Button variant="outline" onClick={() => navigate("/grounds")}>
            View All Grounds <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50">
        <div className="container mx-auto px-4 py-16">
          <h2 className="section-heading text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Search", desc: "Find sports grounds in your city with real-time availability." },
              { icon: Calendar, title: "Book a Slot", desc: "Pick your preferred time slot and confirm your booking instantly." },
              { icon: Zap, title: "Play!", desc: "Show up, pay at the ground, and enjoy your game. It's that simple." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-secondary rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-secondary-foreground mb-2">
              Own a Ground? List it here!
            </h2>
            <p className="text-secondary-foreground/60 max-w-md">
              Increase your visibility, manage bookings effortlessly, and grow your revenue.
            </p>
          </div>
          <Button variant="hero" size="lg" onClick={() => navigate("/auth")} className="whitespace-nowrap">
            <Shield className="mr-2 h-5 w-5" />
            Register as Owner
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IndexPage;
