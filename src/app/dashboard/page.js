import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata = {
  title: "Dashboard - Oleidian",
  description: "Track design system commits, contribution heatmaps, and repository activity.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
