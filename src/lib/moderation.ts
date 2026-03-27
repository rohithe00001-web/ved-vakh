import { supabase } from '@/integrations/supabase/client';

export interface ModerationResult {
  is_flagged: boolean;
  toxicity_score: number;
  severity_level: number;
  explanation: string;
  flagged_terms: string[];
  masked_text: string;
  suggestion: string;
}

export async function moderateMessage(
  userId: string,
  message: string,
  type: 'text' | 'voice' | 'image' | 'video' = 'text',
  mediaUrl?: string
): Promise<ModerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('moderate-message', {
      body: { user_id: userId, message, type, media_url: mediaUrl },
    });

    if (error) throw error;
    return data as ModerationResult;
  } catch (err) {
    console.error('Moderation error:', err);
    // Fail open - allow message if moderation fails
    return {
      is_flagged: false,
      toxicity_score: 0,
      severity_level: 0,
      explanation: '',
      flagged_terms: [],
      masked_text: message,
      suggestion: '',
    };
  }
}

export async function applyModerationPenalty(
  userId: string,
  messageId: string | null,
  severityLevel: number
): Promise<void> {
  // Percentage-based penalty: deduct a % of the current star rating
  const penaltyPercentMap: Record<number, number> = { 1: 2, 2: 6, 3: 10 };
  const actionMap: Record<number, string> = {
    1: 'warning',
    2: '24h_restriction',
    3: 'permanent_ban',
  };
  const action = actionMap[severityLevel] || 'warning';

  // Fetch current profile first to calculate percentage-based penalty
  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_rating, violation_count')
    .eq('user_id', userId)
    .single();

  if (!profile) return;

  const currentRating = Number(profile.profile_rating);
  const penaltyPercent = penaltyPercentMap[severityLevel] || 0;
  const penalty = (penaltyPercent / 100) * currentRating;

  // Log the moderation action
  await supabase.from('moderation_logs').insert({
    user_id: userId,
    message_id: messageId,
    severity_level: severityLevel,
    action_taken: action,
    rating_penalty: Math.round(penalty * 100) / 100,
  });

  const newRating = Math.max(0, currentRating - penalty);
  const newPercent = Math.round((newRating / 5) * 100);
  const updates: Record<string, unknown> = {
    profile_rating: newRating,
    violation_count: (profile.violation_count || 0) + 1,
  };

  // Percentage-based auto-penalties:
  // < 10% → permanent ban
  // 10-50% → warning + 24hr restriction
  if (newPercent < 10) {
    updates.is_banned = true;
    updates.profile_rating = 0;
  } else if (newPercent <= 50) {
    const restriction = new Date();
    restriction.setHours(restriction.getHours() + 24);
    updates.is_restricted = true;
    updates.restriction_until = restriction.toISOString();
  }

  await supabase.from('profiles').update(updates).eq('user_id', userId);
}
