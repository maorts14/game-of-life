import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type CommonProps = {
  icon: ReactNode;
  mobileLabel: string;
  desktopLabel?: string;
  accent?: boolean;
  active?: boolean;
  className?: string;
};

type LinkLikeProps = CommonProps & {
  to: string;
  onClick?: never;
  type?: never;
};

type ButtonLikeProps = CommonProps & {
  to?: never;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
};

type ResponsiveIconButtonProps = LinkLikeProps | ButtonLikeProps;

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getButtonClasses({ accent, active, className }: Pick<CommonProps, "accent" | "active" | "className">) {
  return joinClasses(
    "flex min-w-[56px] shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] px-2 py-1.5 text-slate-300 transition",
    accent
      ? "bg-cyan-400/16 text-cyan-100 hover:bg-cyan-400/22"
      : active
        ? "bg-white/[0.08] text-cyan-200"
        : "hover:bg-white/[0.04] hover:text-white",
    "sm:control-button sm:min-w-0 sm:flex-row sm:rounded-full sm:px-4 sm:py-2.5 sm:text-[16px] sm:text-inherit",
    className,
  );
}

function ButtonContent({ icon, mobileLabel, desktopLabel }: Pick<CommonProps, "icon" | "mobileLabel" | "desktopLabel">) {
  return (
    <>
      {icon}
      <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.14em] sm:hidden">{mobileLabel}</span>
      <span className="hidden sm:inline">{desktopLabel ?? mobileLabel}</span>
    </>
  );
}

export function ResponsiveIconButton(props: ResponsiveIconButtonProps) {
  const content = (
    <ButtonContent
      icon={props.icon}
      mobileLabel={props.mobileLabel}
      desktopLabel={props.desktopLabel}
    />
  );

  if ("to" in props && props.to) {
    return (
      <Link to={props.to} className={getButtonClasses(props)}>
        {content}
      </Link>
    );
  }

  return (
    <button type={props.type ?? "button"} onClick={props.onClick} className={getButtonClasses(props)}>
      {content}
    </button>
  );
}
