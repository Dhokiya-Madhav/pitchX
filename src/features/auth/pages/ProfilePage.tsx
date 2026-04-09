import Navbar from "@/features/shell/components/Navbar";
import Footer from "@/features/shell/components/Footer";
import { ProfilePageContent } from "@/features/auth/pages/ProfilePageContent";

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="section-heading mb-6">Profile</h1>
        <ProfilePageContent />
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
