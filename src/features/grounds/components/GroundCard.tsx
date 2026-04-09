import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Ground } from "@/shared/data/types";

interface GroundCardProps {
  ground: Ground;
}

const GroundCard = ({ ground }: GroundCardProps) => (
  <Link to={`/grounds/${ground.id}`} className="ground-card group block">
    <div className="relative aspect-video overflow-hidden">
      <img
        src={ground.image}
        alt={ground.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      {ground.isLive && (
        <div className="absolute top-3 left-3 status-badge-live">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground animate-pulse-live" />
          LIVE
        </div>
      )}
      <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5">
        <span className="font-display font-bold text-sm text-foreground">₹{ground.pricePerHour}</span>
        <span className="text-muted-foreground text-xs">/hr</span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-display font-bold text-base mb-1 group-hover:text-primary transition-colors">
        {ground.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-2">{ground.address}</p>
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-accent text-accent" />
        <span className="font-semibold text-sm">{ground.rating}</span>
        <span className="text-muted-foreground text-xs">({ground.reviewCount} reviews)</span>
      </div>
    </div>
  </Link>
);

export default GroundCard;
