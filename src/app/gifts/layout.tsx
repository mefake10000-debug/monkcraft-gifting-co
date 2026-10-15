import type { ReactNode } from "react";
import { RouteScroll } from "@/components/RouteScroll";
import "./catalogue.css";

export default function GiftsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <RouteScroll />
      {children}
    </>
  );
}
