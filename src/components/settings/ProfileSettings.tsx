import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User } from 'lucide-react';
import ProfileRating from '@/components/ui/ProfileRating';

interface Props { onBack: () => void; }

const ProfileSettings: React.FC<Props> = ({ onBack }) => {
  const { profile } = useAuth();
  const rating = profile?.profile_rating ?? 5;
  const violations = profile?.violation_count ?? 0;
  const ratingPercent = (rating / 5) * 100;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </button>
        <div className="flex items-center gap-2 mb-2">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">Profile Settings</h2>
        </div>

        <div className="glass rounded-2xl p-5 space-y-5">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Edit Profile Info</p>
            <p className="text-sm text-muted-foreground">
              Go to the <span className="text-primary font-medium">Profile</span> tab to edit your name, phone, location and bio.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-1">Your SAFE-ID</p>
            <p className="text-sm font-mono text-primary">{profile?.username}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Rating Breakdown</p>
            <ProfileRating rating={rating} size="md" />
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all ${ratingPercent >= 80 ? 'bg-primary' : ratingPercent >= 40 ? 'bg-accent' : 'bg-destructive'}`}
                style={{ width: `${ratingPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Trust Score: {ratingPercent.toFixed(0)}% · {violations} violation{violations !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
