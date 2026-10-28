import type { CSSProperties, ReactNode } from "react";

type BracketsProps = {
  className?: string;
  /** horizontal tick length in reference units */
  tick?: number;
  color?: string;
  children?: ReactNode;
  style?: CSSProperties;
};

/**
 * Wraps content in the thin "[  ]" brackets that frame every headline in the
 * reference design.
 */
export function Brackets({ className = "", tick = 23, color, children, style }: BracketsProps) {
  return (
    <div
      className={`relative ${className}`}
      style={
        {
          "--tick": `calc(var(--u) * ${tick})`,
          ...(color ? { "--bracket-color": color } : {}),
          ...style,
        } as CSSProperties
      }
    >
      <span aria-hidden className="bracket-l" data-bracket="left" />
      {children}
      <span aria-hidden className="bracket-r" data-bracket="right" />
    </div>
  );
}

type CornersProps = {
  className?: string;
  size?: number;
  color?: string;
  children?: ReactNode;
  style?: CSSProperties;
};

/** Four-corner reticle frame (icon boxes, "Scroll" button, cursor). */
export function CornerBox({ className = "", size = 6, color, children, style }: CornersProps) {
  return (
    <div className={`relative ${className}`} style={style}>
      <span
        aria-hidden
        className="corners"
        style={
          {
            "--corner-size": `calc(var(--u) * ${size})`,
            ...(color ? { "--corner-color": color } : {}),
          } as CSSProperties
        }
      />
      {children}
    </div>
  );
}

/** "(HOME)WISE NETWORK ........ SINCE 2016" row at the bottom of sections. */
export function FooterRow({ className = "" }: { className?: string }) {
  return (
    <div
      data-verify="footer-row"
      className={`absolute inset-x-22 top-380 flex h-8 items-center justify-between text-u6 uppercase tracking-[0.01em] text-hw-ink/90 max-md:top-auto max-md:bottom-16 ${className}`}
    >
      <span>(HOME)WISE NETWORK</span>
      <span>SINCE 2016</span>
    </div>
  );
}
