import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModerationResult {
  is_flagged: boolean;
  toxicity_score: number;
  severity_level: number;
  explanation: string;
  flagged_terms: string[];
  masked_text: string;
  suggestion: string;
}

interface ModerationPopupProps {
  result: ModerationResult;
  onContinue: () => void;
  onCancel: () => void;
  originalMessage: string;
}

const severityConfig = {
  1: {
    color: 'border-warning/50 bg-warning/5',
    headerColor: 'bg-warning/10',
    icon: '⚠️',
    label: 'Mild Warning',
    penalty: '-2% of your star rating',
    penaltyColor: 'text-warning',
    action: 'Warning will be issued',
  },
  2: {
    color: 'border-orange-500/50 bg-orange-500/5',
    headerColor: 'bg-orange-500/10',
    icon: '🚫',
    label: 'Moderate Violation',
    penalty: '-6% of your star rating + 24h restriction',
    penaltyColor: 'text-orange-400',
    action: '24-hour account restriction',
  },
  3: {
    color: 'border-destructive/50 bg-destructive/5',
    headerColor: 'bg-destructive/10',
    icon: '🔴',
    label: 'Severe Violation',
    penalty: '-10% of your star rating',
    penaltyColor: 'text-destructive',
    action: 'Account will be permanently banned',
  },
};

const ModerationPopup: React.FC<ModerationPopupProps> = ({
  result,
  onContinue,
  onCancel,
  originalMessage,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const config = severityConfig[result.severity_level as keyof typeof severityConfig] || severityConfig[1];
  const toxicityPercent = Math.round(result.toxicity_score * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={cn(
        'w-full max-w-md rounded-2xl border shadow-card overflow-hidden animate-fade-in',
        config.color
      )}>
        {/* Header */}
        <div className={cn('px-5 py-4', config.headerColor)}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="font-display font-bold text-foreground">Content Warning Detected</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{config.label}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Warning message */}
          <div className="space-y-2">
            <p className="text-sm text-foreground/90 leading-relaxed">
              ⚠️ <strong>This message contains sensitive content.</strong><br />
              It may affect your profile rating. Severe violations may lead to permanent suspension.
            </p>
            {result.explanation && (
              <p className="text-sm text-muted-foreground italic">&ldquo;{result.explanation}&rdquo;</p>
            )}
          </div>

          {/* Toxicity score bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Toxicity Level</span>
              <span className="font-mono font-bold text-foreground">{toxicityPercent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  toxicityPercent > 70 ? 'bg-destructive' : toxicityPercent > 40 ? 'bg-orange-500' : 'bg-warning'
                )}
                style={{ width: `${toxicityPercent}%` }}
              />
            </div>
          </div>

          {/* Penalty warning */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-border/50">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Penalty if continued:</p>
              <p className={cn('text-xs font-semibold', config.penaltyColor)}>{config.penalty}</p>
            </div>
          </div>

          {/* Expandable details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-primary hover:underline w-full"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showDetails ? 'Hide details' : 'View details & flagged words'}
          </button>

          {showDetails && (
            <div className="space-y-3 animate-fade-in">
              {result.flagged_terms.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Flagged terms:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.flagged_terms.map((term, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-destructive/20 text-destructive border border-destructive/30 font-mono">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.masked_text && result.masked_text !== originalMessage && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Masked version:</p>
                  <p className="text-xs bg-card border border-border rounded-lg p-2 font-mono text-foreground/80">
                    {result.masked_text}
                  </p>
                </div>
              )}

              {result.suggestion && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Suggestion:</p>
                  <p className="text-xs text-primary italic">{result.suggestion}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-border hover:bg-muted h-11 font-semibold"
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            ❌ Cancel
          </Button>
          <Button
            onClick={onContinue}
            className={cn(
              'h-11 font-semibold text-white',
              result.severity_level === 3
                ? 'bg-destructive hover:bg-destructive/90'
                : result.severity_level === 2
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-warning hover:bg-warning/90'
            )}
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            ✅ Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModerationPopup;
