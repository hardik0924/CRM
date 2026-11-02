import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "default",
  className = "",
  disabled = false,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer min-h-[44px] rounded-md";

  const variants = {
    primary:
      "bg-vsph-core-blue text-white hover:bg-vsph-navy focus:ring-vsph-core-blue",
    secondary:
      "border-vsph-navy text-vsph-navy bg-white hover:bg-vsph-navy hover:text-white focus:ring-vsph-navy",
    ghost:
      "text-vsph-core-blue hover:bg-vsph-light-blue/20 focus:ring-vsph-core-blue",
    danger:
      "bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500",
  };

  const sizes = {
    default: "px-5 py-2.5 text-sm",
    sm: "px-3.5 py-1.5 text-xs",
    lg: "px-6 py-3 text-base",
    icon: "p-2.5",
    iconSm: "p-1.5",
    pill: "px-4 py-1.5 text-xs rounded-full",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.default} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
