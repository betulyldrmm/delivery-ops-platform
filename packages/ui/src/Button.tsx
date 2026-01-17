import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

export function Button({ children, onClick, variant = "primary" }: ButtonProps) {
  const base = "px-4 py-2 rounded text-sm";
  const style = variant === "primary" ? "bg-black text-white" : "bg-gray-200";
  return (
    <button className={`${base} ${style}`} onClick={onClick}>
      {children}
    </button>
  );
}
