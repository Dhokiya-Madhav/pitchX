import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-secondary text-secondary-foreground">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-display font-black text-xl mb-4">
            <span className="text-primary">PLAY</span>SPOT
          </h3>
          <p className="text-secondary-foreground/60 text-sm leading-relaxed">
            India's premier sports ground booking platform. Find, book, and play — it's that simple.
          </p>
        </div>
        <div>
          <h4 className="font-display font-bold text-sm mb-4 uppercase tracking-wider text-secondary-foreground/40">For Players</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/60">
            <li><Link to="/grounds" className="hover:text-primary transition-colors">Find Grounds</Link></li>
            <li><Link to="/bookings" className="hover:text-primary transition-colors">My Bookings</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-sm mb-4 uppercase tracking-wider text-secondary-foreground/40">For Owners</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/60">
            <li><Link to="/auth" className="hover:text-primary transition-colors">List Your Ground</Link></li>
            <li><Link to="/owner/dashboard" className="hover:text-primary transition-colors">Owner Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-sm mb-4 uppercase tracking-wider text-secondary-foreground/40">Support</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/60">
            <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-secondary-foreground/10 mt-8 pt-8 text-center text-xs text-secondary-foreground/40">
        © 2026 PlaySpot. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
