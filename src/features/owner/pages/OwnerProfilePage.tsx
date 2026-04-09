import { useNavigate } from "react-router-dom";
import { OwnerShellLayout, type OwnerShellTab } from "@/features/owner/components/OwnerShellLayout";
import { ProfilePageContent } from "@/features/auth/pages/ProfilePageContent";

const OwnerProfilePage = () => {
  const navigate = useNavigate();

  const onSelectTab = (tab: OwnerShellTab) => {
    navigate("/owner/dashboard", { state: { tab } });
  };

  return (
    <OwnerShellLayout title="Profile" activeTab={null} onSelectTab={onSelectTab}>
      <div className="p-4 lg:p-8">
        <ProfilePageContent />
      </div>
    </OwnerShellLayout>
  );
};

export default OwnerProfilePage;
