import * as React from "react";
import * as Lucide from "lucide-react";
import styles from "./PageFeedback.module.css";
import { analytics } from "../../utils/analytics";
import type { PageVote } from "../../utils/analytics";
import { useLocation } from "react-router";
import { Button } from "../ui/Button";
import { STORAGE_KEYS } from "../../lib/storage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/Tooltip";

interface PageFeedbackProps {
  pageId?: string;
  className?: string;
}

const FEEDBACK_OPTIONS: Array<{
  type: PageVote;
  icon: React.ReactNode;
  label: string;
  ariaLabel: string;
}> = [
  {
    type: "positive",
    icon: <Lucide.Smile size={20} />,
    label: "Sim, foi útil",
    ariaLabel: "Sim, foi útil",
  },
  {
    type: "meh",
    icon: <Lucide.Meh size={20} />,
    label: "Não sei",
    ariaLabel: "Não sei",
  },
  {
    type: "negative",
    icon: <Lucide.Frown size={20} />,
    label: "Não foi útil",
    ariaLabel: "Não foi útil",
  },
];

function FeedbackButton({
  option,
  isActive,
  isDisabled,
  onClick,
}: {
  option: (typeof FEEDBACK_OPTIONS)[0];
  isActive: boolean;
  isDisabled: boolean;
  onClick?: () => void;
}) {
  const buttonContent = (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className={`${styles.feedbackBtn} ${isActive ? styles.active : ""}`}
      disabled={isDisabled}
      aria-label={option.ariaLabel}
    >
      {option.icon}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{buttonContent}</span>
      </TooltipTrigger>
      <TooltipContent>{option.label}</TooltipContent>
    </Tooltip>
  );
}

export function PageFeedback({ pageId, className }: PageFeedbackProps) {
  const location = useLocation();
  const pathToLog = pageId || location.pathname;
  const storageKey = STORAGE_KEYS.FEEDBACK.PAGE_VOTE(pathToLog);

  const [hasVoted, setHasVoted] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!sessionStorage.getItem(storageKey);
  });

  const [voteType, setVoteType] = React.useState<PageVote | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = sessionStorage.getItem(storageKey) as PageVote | null;
    return saved ? saved : null;
  });

  const handleVote = (vote: PageVote) => {
    if (hasVoted) return;

    setHasVoted(true);
    setVoteType(vote);
    sessionStorage.setItem(storageKey, vote);

    analytics.trackPageFeedback(pathToLog, vote);
  };

  return (
    <TooltipProvider>
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.questionWrapper}>
          <span className={styles.question}>{hasVoted ? "Obrigado!" : "Isso foi útil?"}</span>

          <div className={styles.actions} style={hasVoted ? { marginLeft: "auto" } : undefined}>
            {FEEDBACK_OPTIONS.map((option) => (
              <FeedbackButton
                key={option.type}
                option={option}
                isActive={voteType === option.type}
                isDisabled={hasVoted}
                onClick={hasVoted ? undefined : () => handleVote(option.type)}
              />
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
