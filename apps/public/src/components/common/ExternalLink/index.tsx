import type { CSSProperties, ReactNode } from "react";
import styles from "./Link.module.css";

interface IconLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  style?: CSSProperties;
}

interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  style?: CSSProperties;
}

export const ExternalIconLink = ({
  href,
  icon,
  children,
  className = "",
  target = "_blank",
  rel = "noopener noreferrer",
  style,
}: IconLinkProps) => {
  return (
    <div className={`${styles.link} ${styles.iconLink} ${className}`} style={style}>
      {icon}
      <a href={href} target={target} rel={rel} className="ml-2">
        {children}
      </a>
    </div>
  );
};

export const ExternalLink = ({
  href,
  children,
  className = "",
  target = "_blank",
  rel = "noopener noreferrer",
  style,
}: LinkProps) => {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      style={style}
      className={`${styles.link} ${className}`}
    >
      {children}
    </a>
  );
};
