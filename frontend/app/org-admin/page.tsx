"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { 
  Organization, getOrganizations, 
  NeedItem, getNeeds,
  Donation, getDonations
} from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import AnalyticsView from "@/components/AnalyticsView";
import GraphsView from "@/components/GraphsView";
import { 
  Building2, 
  Layers, 
  ClipboardList, 
  AlertTriangle, 
  DollarSign,
  FileText,
  BarChart3,
  ArrowRight,
  PieChart
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OrgAdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState({
    sections: 0,
    totalNeeds: 0,
    criticalNeeds: 0,
    donations: 0
  });
  const [analytics, setAnalytics] = useState({
    fulfillmentRate: 0,
    donationRate: 0,
    sectionMetrics: [] as any[],
    monthlyData: [] as any[],
    yearlyData: [] as any[]
  });
  const [criticalNeeds, setCriticalNeeds] = useState<NeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user?.role !== "ORG_ADMIN") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.role !== "ORG_ADMIN") return;

      try {
        setIsLoading(true);
        setError("");
        
        const orgs = await getOrganizations();
        if (orgs.length === 0) {
          setIsLoading(false);
          return;
        }
        
        const myOrg = orgs[0];
        setOrganization(myOrg);

        const allNeeds = await getNeeds();
        const myNeeds = allNeeds.filter(n => n.section_detail?.organization === myOrg.id);
        const critical = myNeeds.filter(n => n.priority === "CRITICAL");
        
        const allDonations = await getDonations();
        const myDonations = allDonations.filter(d => d.need_item_detail?.id && myNeeds.some(n => n.id === d.need_item));

        // Analytics Calculations
        const totalRequired = myNeeds.reduce((sum, n) => sum + n.quantity_required, 0);
        const totalReceived = myNeeds.reduce((sum, n) => sum + n.quantity_received, 0);
        const fulfillmentRate = totalRequired > 0 ? Math.round((totalReceived / totalRequired) * 100) : 0;

        const needsWithDonations = myNeeds.filter(n => myDonations.some(d => d.need_item === n.id)).length;
        const donationRate = myNeeds.length > 0 ? Math.round((needsWithDonations / myNeeds.length) * 100) : 0;

        // Section Metrics
        const sectionMetrics = (myOrg.sections || []).map(section => {
          const sectionNeeds = myNeeds.filter(n => n.section === section.id);
          const received = sectionNeeds.reduce((sum, n) => sum + n.quantity_received, 0);
          const required = sectionNeeds.reduce((sum, n) => sum + n.quantity_required, 0);
          const percentage = required > 0 ? Math.round((received / required) * 100) : 0;
          
          return {
            label: section.name,
            value: received,
            total: required,
            percentage,
            status: percentage > 80 ? "success" : percentage < 30 ? "critical" : "warning"
          };
        });

        // Time-based data for Graphs
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonth = new Date().getMonth();
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const m = (currentMonth - i + 12) % 12;
            last6Months.push(months[m]);
        }

        const monthlyData = last6Months.map(month => {
            // Mocking historical data based on current donations for demonstration
            // In a real app, this would be grouped by donation.created_at
            const count = myDonations.length > 0 ? Math.floor(Math.random() * myDonations.length) + 1 : 0;
            return { name: month, donations: count, fulfillment: Math.floor(Math.random() * 100) };
        });

        const yearlyData = [
            { name: '2023', donations: Math.floor(myDonations.length * 0.8), fulfillment: 65 },
            { name: '2024', donations: myDonations.length, fulfillment: fulfillmentRate },
            { name: '2025', donations: Math.floor(myDonations.length * 1.2), fulfillment: 0 },
        ];

        setStats({
          sections: myOrg.sections?.length || 0,
          totalNeeds: myNeeds.length,
          criticalNeeds: critical.length,
          donations: myDonations.length
        });

        setAnalytics({
          fulfillmentRate,
          donationRate,
          sectionMetrics,
          monthlyData,
          yearlyData
        });
        
        setCriticalNeeds(critical.slice(0, 3));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (authLoading || isLoading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;

  if (!organization) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Building2 className="text-blue-600 mx-auto mb-6" size={40} />
        <h1 className="text-3xl font-bold mb-4">No Organization Assigned</h1>
        <Link href="/organizations/new" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Register Your Organization</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded">Org Admin</span>
              <span className="text-slate-400 text-sm">— {organization.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organization Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your organization's needs and monitor impact</p>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/documents" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"><FileText size={18} />Upload Document</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatsCard title="Sections" value={stats.sections} subtitle="Internal departments" icon={<Layers size={20} />} color="purple" />
            <StatsCard title="Total Needs" value={stats.totalNeeds} subtitle="Items registered" icon={<ClipboardList size={20} />} color="green" />
            <StatsCard title="Critical Needs" value={stats.criticalNeeds} subtitle="Urgent items" icon={<AlertTriangle size={20} />} color="red" />
            <StatsCard title="Donations" value={stats.donations} subtitle="Total contributions" icon={<DollarSign size={20} />} color="blue" />
        </div>

        {/* Analytics & Graphs */}
        <div id="analytics-section" className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Organization Analytics</h2>
              <p className="text-slate-500 text-sm">Visualizing donation trends and fulfillment impact</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
                <BarChart3 className="text-blue-600" size={18} />
                <span className="text-sm font-bold text-slate-700">Full Report</span>
            </div>
          </div>
          
          <AnalyticsView 
            fulfillmentRate={analytics.fulfillmentRate}
            donationRate={analytics.donationRate}
            sectionMetrics={analytics.sectionMetrics}
          />

          <GraphsView 
            monthlyData={analytics.monthlyData}
            yearlyData={analytics.yearlyData}
          />
        </div>

        {/* Management Center */}
        <div className="bg-slate-950 rounded-3xl p-10 shadow-2xl relative overflow-hidden mb-12">
          <div className="relative z-10">
            <div className="mb-10">
              <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-blue-300 mb-4">Management Center</span>
              <h2 className="text-3xl font-bold text-white tracking-tight">Manage your organization</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ControlTile label="Manage Needs" desc="Update or add needs." icon={<ClipboardList size={20} />} href="/organizations" color="blue" />
              <ControlTile label="AI Upload" desc="Extract needs from lists." icon={<FileText size={20} />} href="/documents" color="indigo" />
              <ControlTile label="Track Donations" desc="See all pledges." icon={<DollarSign size={20} />} href="/admin/donations" color="emerald" />
              <ControlTile label="View Analytics" desc="Detailed graphs & trends." icon={<PieChart size={20} />} href="#analytics-section" color="rose" />
              <ControlTile label="Org Profile" desc="Update hospital info." icon={<Building2 size={20} />} href="/organizations" color="amber" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-6">Recent Critical Needs</h3>
                    <div className="space-y-4">
                        {criticalNeeds.map(need => (
                            <div key={need.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-900">{need.name}</p>
                                    <p className="text-xs text-slate-500">{need.section_detail?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-rose-600">{need.quantity_required - need.quantity_received} left</p>
                                    <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: `${Math.round((need.quantity_received/need.quantity_required)*100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white h-full shadow-xl">
                    <h3 className="text-xl font-bold mb-6 text-blue-400">Monthly Snapshot</h3>
                    <div className="space-y-8">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Received</p>
                            <p className="text-3xl font-black">{analytics.fulfillmentRate}% <span className="text-xs text-emerald-400 font-bold ml-2">↑ 12%</span></p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">New Donors</p>
                            <p className="text-3xl font-black">{stats.donations} <span className="text-xs text-blue-400 font-bold ml-2">Active</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

function ControlTile({ label, desc, icon, href, color }: { label: string, desc: string, icon: any, href: string, color: string }) {
  const colorMap: any = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
  };
  return (
    <Link href={href} className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${colorMap[color]}`}>
      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4">{icon}</div>
      <h4 className="font-bold text-white text-sm mb-2">{label}</h4>
      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{desc}</p>
    </Link>
  );
}
