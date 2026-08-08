import type { Metadata } from "next";
import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: ReactNode }) { return <div className="min-h-screen bg-[#f3f1ed] md:flex"><AdminSidebar/><main className="min-w-0 flex-1 p-5 md:p-10">{children}</main></div>; }
