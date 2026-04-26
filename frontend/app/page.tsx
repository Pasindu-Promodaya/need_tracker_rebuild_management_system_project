"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Organization, NeedItem, getOrganizations, getNeeds } from "@/lib/api";
import StatsCard from "@/components/StatsCard";
import NeedCard from "@/components/NeedCard";
import OrganizationCard from "@/components/OrganizationCard";
import AdvancedSriLankaMap from "@/components/AdvancedSriLankaMap";
import { PageLoading } from "@/components/LoadingSpinner";
import { useAuth } from "@/lib/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [criticalNeeds, setCriticalNeeds] = useState<NeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const footerRef = useRef<HTMLElement>(null);

  const fetchData = async () => {
    try {
      const [orgs, needs] = await Promise.all([
        getOrganizations(),
        getNeeds("CRITICAL", true),
      ]);
      setOrganizations(orgs);
      setCriticalNeeds(needs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await fetchData();
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <PageLoading />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Data
          </h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalOrganizations = Array.isArray(organizations)
    ? organizations.length
    : 0;
  const totalSections = Array.isArray(organizations)
    ? organizations.reduce((acc, org) => acc + (org.sections?.length || 0), 0)
    : 0;
  const totalNeeds = Array.isArray(organizations)
    ? organizations.reduce(
        (acc, org) =>
          acc +
          (org.sections?.reduce(
            (sacc, sec) =>
              sacc +
              (sec.needs?.filter(
                (n) => n.quantity_received < n.quantity_required,
              ).length || 0),
            0,
          ) || 0),
        0,
      )
    : 0;
  const totalCritical = criticalNeeds.length;

  const handleFooterMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const footerEl = footerRef.current;
    if (!footerEl) return;
    const rect = footerEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    footerEl.style.setProperty("--mx", `${x}px`);
    footerEl.style.setProperty("--my", `${y}px`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section - Landing Page Style */}
      <div className="w-full relative bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300 rounded-full blur-3xl opacity-10"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Content */}
            <div className="relative z-10 space-y-6">
              {/* Live Badge with Animation */}
              <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-md rounded-full border border-white border-opacity-40 hover:border-opacity-60 transition-all duration-300 animate-fade-in-down shadow-lg hover:shadow-xl hover:bg-opacity-25 cursor-pointer">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
                <span className="text-sm font-semibold text-black tracking-wide">
                  ✨ Live across Sri Lanka
                </span>
              </div>

              {/* Main Heading with Staggered Animation */}
              <div className="space-y-3 animate-fade-in-up">
                <h1 className="text-6xl sm:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                  {user?.role === "ADMIN"
                    ? "Welcome Back, Admin"
                    : user?.role === "ORG_ADMIN"
                      ? "Organization Dashboard"
                      : "What's Needed Right Now"}
                </h1>
                <div className="w-24 h-1.5 bg-gradient-to-r from-yellow-300 to-green-300 rounded-full shadow-lg"></div>
              </div>

              {/* Description with Animation */}
              <p className="text-lg sm:text-xl text-blue-50 mb-8 max-w-xl leading-relaxed animate-fade-in-up">
                {user?.role === "ORG_ADMIN"
                  ? "Manage your organization's needs and track donations in real-time with comprehensive analytics"
                  : user?.role === "ADMIN"
                    ? "Monitor all organizations and critical needs across the network with real-time insights"
                    : "Connect hospitals and healthcare organizations with donors across Sri Lanka. Browse critical needs and make an impact in your community today."}
              </p>

              {/* Action Buttons with Hover Effects */}
              <div className="flex flex-wrap gap-4 pt-4 animate-fade-in-up">
                {user?.role === "DONOR" && (
                  <>
                    <Link href="/needs" className="group relative px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">
                      <span className="relative z-10">Browse Current Needs</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                    <Link href="/login?tab=register" className="group px-8 py-4 bg-white bg-opacity-20 text-white font-bold rounded-xl hover:bg-opacity-30 transition-all duration-300 border-2 border-white border-opacity-40 hover:border-opacity-60 transform hover:scale-105 active:scale-95 backdrop-blur-sm">
                      Register as Donor
                    </Link>
                  </>
                )}
              </div>

              {/* Stats Row */}
              <div className="pt-8 grid grid-cols-3 gap-4 animate-fade-in-up">
                <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
                  <div className="text-2xl font-bold text-green-300">9</div>
                  <div className="text-sm text-black">Provinces</div>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
                  <div className="text-2xl font-bold text-yellow-300">{totalOrganizations}</div>
                  <div className="text-sm text-black">Active Orgernizations </div>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
                  <div className="text-2xl font-bold text-blue-200">{totalCritical}</div>
                  <div className="text-sm text-black">Critical Needs</div>
                </div>
              </div>
            </div>

            {/* Right Content - Sri Lanka Map with Enhanced Styling */}
            <div className="relative w-full animate-fade-in-down">
              <div className="relative w-full">
                {/* Main map container */}
                <div className="relative w-full bg-white bg-opacity-15 backdrop-blur-xl rounded-3xl border border-white border-opacity-40 overflow-hidden shadow-2xl h-[620px] lg:h-[600px] hover:border-opacity-60 transition-all duration-300 hover:shadow-blue-500/40 hover:shadow-2xl">
                  <AdvancedSriLankaMap organizations={organizations} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
          <div className="absolute -top-20 -left-12 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute top-40 -right-16 h-80 w-80 rounded-full bg-indigo-200/25 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-sky-200/25 blur-3xl" />
        </div>
        <div className="absolute inset-0 -z-10 rounded-3xl border border-blue-100/80 bg-linear-to-b from-white/95 via-blue-50/70 to-indigo-50/60 shadow-[0_24px_60px_-40px_rgba(37,99,235,0.45)] backdrop-blur-sm" />

        <div className="relative px-1 sm:px-2">
        {/* Stats Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Overview</h2>
          <div className={`grid gap-6 sm:grid-cols-2 ${user?.role === "DONOR" ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            {(user?.role === "ADMIN" || user?.role === "ORG_ADMIN") && (
              <>
                <StatsCard
                  title="Organizations"
                  value={totalOrganizations}
                  subtitle="Active organizations"
                  color="blue"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
                <StatsCard
                  title="Sections"
                  value={totalSections}
                  subtitle="Departments tracked"
                  color="purple"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  }
                />
              </>
            )}
            {user?.role === "DONOR" && (
              <StatsCard
                title="Organizations"
                value={totalOrganizations}
                subtitle="Active organizations"
                color="blue"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
            )}
            <StatsCard
              title="Total Needs"
              value={totalNeeds}
              subtitle="Items registered"
              color="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
            />
            <StatsCard
              title="Critical Needs"
              value={totalCritical}
              subtitle="Urgent attention required"
              color="red"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* ORG_ADMIN Quick Actions */}
        {user?.role === "ORG_ADMIN" && (
          <div className="mb-8 bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <h2 className="text-xl font-bold text-gray-900">Donation Management</h2>
                  </div>
                  <p className="text-base text-gray-600">Review, confirm, and manage all donations for your organization</p>
                </div>
                <Link
                  href="/admin/donations"
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 transition-all font-semibold whitespace-nowrap shadow-md"
                >
                  Manage →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Critical Needs Section */}
        {criticalNeeds.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-100">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 6a1 1 0 11-2 0 1 1 0 012 0zM13 12a1 1 0 11-2 0 1 1 0 012 0zM13 18a1 1 0 11-2 0 1 1 0 012 0zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Critical Needs Requiring Attention</h2>
                  <p className="text-sm text-gray-500 mt-1">{totalCritical} urgent items • Immediate assistance needed</p>
                </div>
              </div>
              <Link
                href="/needs?priority=CRITICAL"
                className="text-sm font-semibold text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                View All ({totalCritical}) →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {criticalNeeds.slice(0, 6).map((need) => (
                <NeedCard key={need.id} need={need} showSection organizationName={need.section_detail?.organization_name} />
              ))}
            </div>
          </div>
        )}

        {/* Organizations Section */}
        {user?.role !== "ORG_ADMIN" && user?.role !== "ADMIN" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Featured Organizations</h2>
                  <p className="text-sm text-gray-500 mt-1">{totalOrganizations} active organizations</p>
                </div>
              </div>
              <Link href="/organizations" className="text-sm font-semibold text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                View All →
              </Link>
            </div>
            {organizations.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {organizations.slice(0, 6).map((org) => (
                  <OrganizationCard key={org.id} organization={org} />
                ))}
              </div>
            ) : (
              <div className="bg-white/85 rounded-xl shadow-sm border border-blue-100 p-12 text-center hover:shadow-lg hover:border-blue-200 backdrop-blur-sm transition-all">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Organizations Yet</h3>
                <p className="text-gray-500">No organization has been registered in the system.</p>
              </div>
            )}
          </div>
        )}

        {/* Call to Action - For Donors */}
        {user?.role === "DONOR" && (
          <div className="mt-16 mb-8">
            <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-sm p-8 sm:p-12">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to Make an Impact?</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">Browse organizations and their needs, then make a donation to help those in need</p>
                <Link
                  href="/organizations"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-linear-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 active:scale-95 transition-all font-semibold shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Explore Organizations
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Role-specific Actions */}
        {user?.role === "ADMIN" ? (
          <div className="mt-16 mb-0">
            <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-8 sm:px-8 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.65)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div>
                  <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/80">
                    Admin Control Center
                  </p>
                  <h2 className="mt-3 text-3xl font-bold text-white">Operational overview for administrators</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
                    Monitor the platform, review urgent needs, and jump directly to the most important administrative workflows.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
                <Link href="/admin" className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/10 hover:border-white/20">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/20">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Donation Management</h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100/75">Review and confirm incoming donations in one place.</p>
                </Link>

                <Link href="/organizations" className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/10 hover:border-white/20">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-100 ring-1 ring-blue-400/20">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Manage Organizations</h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100/75">Create, update, and monitor organizations across the network.</p>
                </Link>

                <Link href="/needs?priority=CRITICAL" className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/10 hover:border-white/20">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/20">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Review Critical Needs</h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100/75">Focus on urgent items and ensure faster platform response.</p>
                </Link>

                <Link href="/documents" className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/10 hover:border-white/20">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/20">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Document Uploads</h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100/75">Manage proof of delivery and supporting files.</p>
                </Link>

                <Link href="/impact" className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/10 hover:border-white/20">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/20">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Impact Analytics</h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100/75">Track donation outcomes and platform performance.</p>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-16 mb-0">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Quick Actions</h2>
              <p className="text-gray-600">Get started in seconds</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Find Needs Card */}
              <Link href="/needs" className="group bg-white/85 rounded-xl border border-blue-100 p-8 text-center backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-blue-300">
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Find Needs</h3>
                <p className="text-gray-600 text-sm">Browse all active needs by category or location</p>
              </Link>

              {/* Register Organization Card */}
              <Link href="/login?tab=org-admin" className="group bg-white/85 rounded-xl border border-purple-100 p-8 text-center backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-purple-300">
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Register Organization</h3>
                <p className="text-gray-600 text-sm">Add your hospital or clinic to the platform</p>
              </Link>

              {/* Become a Donor Card */}
              <Link href="/login?tab=register" className="group bg-white/85 rounded-xl border border-red-100 p-8 text-center backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-red-300">
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 group-hover:bg-red-200 transition-colors">
                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Become a Donor</h3>
                <p className="text-gray-600 text-sm">Sign up and start contributing to causes</p>
              </Link>

              {/* View Impact Card */}
              <Link href="/impact" className="group bg-white/85 rounded-xl border border-amber-100 p-8 text-center backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-amber-300">
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors">
                    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">View Impact</h3>
                <p className="text-gray-600 text-sm">See donation stats and success stories</p>
              </Link>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Footer */}
      <footer
        ref={footerRef}
        onMouseMove={handleFooterMouseMove}
        className="interactive-surface bg-linear-to-r from-slate-950 via-blue-950 to-indigo-950 border-t border-blue-900/60 mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left - Logo and Branding */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/90 text-white font-bold shadow-sm shadow-blue-500/40">
                ℜ
              </span>
              <span className="font-semibold text-blue-50">NeedTracker - Sri Lanka</span>
            </div>

            {/* Center - Copyright */}
            <p className="text-sm text-blue-100/80">
              © 2025 NeedTracker. Connecting hospitals with donors.
            </p>

            {/* Right - Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link href="/about" className="text-blue-100/80 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/privacy" className="text-blue-100/80 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-blue-100/80 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="text-blue-100/80 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
