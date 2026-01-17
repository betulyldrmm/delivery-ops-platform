import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"]
});

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <div className={manrope.className}>{children}</div>;
}
