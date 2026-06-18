import React from "react";
import { Organization, NeedItem } from "@/lib/api";
import { Building2, Layers, CheckCircle2, Flame, PlayCircle, ClipboardList } from "lucide-react";

interface OrgLobbyMapProps {
  organization: Organization;
  needs: NeedItem[];
}

export default function OrgLobbyMap({ organization, needs }: OrgLobbyMapProps) {
  const sectionsList = organization.sections || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm overflow-hidden mb-12">
      {/* Inline styles for lobby animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes lobbyFadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes lobbyFadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes lobbyGrowHeight {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
        @keyframes lobbyGrowWidth {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        .lobby-animate-parent {
          animation: lobbyFadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .lobby-animate-child {
          animation: lobbyFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .lobby-animate-line-y {
          animation: lobbyGrowHeight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top;
          transform: scaleY(0);
        }
        .lobby-animate-line-x {
          animation: lobbyGrowWidth 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: center;
          transform: scaleX(0);
        }
      `}} />

      <div className="mb-6 text-center sm:text-left">
        <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
          <Building2 className="text-blue-600" size={22} />
          Organization Lobby Map
        </h3>
        <p className="text-slate-500 text-sm mt-1">
          Interactive bird&apos;s-eye view of sections and real-time need fulfillment
        </p>
      </div>

      {/* Diagram container */}
      <div className="flex flex-col items-center py-6 w-full overflow-x-auto min-w-[700px]">
        {/* Parent Box: Organization */}
        <div className="relative group flex flex-col items-center lobby-animate-parent">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md w-72 text-center transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lg group-hover:shadow-indigo-600/20 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
              <Building2 size={24} />
            </div>
            <h4 className="font-extrabold text-base tracking-tight mb-1">
              {organization.name}
            </h4>
            <span className="inline-block text-[10px] px-2 py-0.5 bg-white/15 rounded-full font-semibold uppercase tracking-wider">
              {organization.org_type || "Institution"}
            </span>
          </div>

          {/* Vertical stem down from parent */}
          {sectionsList.length > 0 && (
            <div 
              className="w-px h-8 bg-slate-300 lobby-animate-line-y" 
              style={{ animationDelay: "0.3s" }}
            />
          )}
        </div>

        {sectionsList.length > 0 ? (
          <div className="w-full flex flex-col items-center">
            {/* Horizontal bridge connecting children */}
            {sectionsList.length > 1 && (
              <div className="relative w-full h-px">
                <div 
                  className="absolute h-px bg-slate-300 lobby-animate-line-x" 
                  style={{ 
                    animationDelay: "0.5s",
                    left: `calc(100% / ${sectionsList.length} / 2)`,
                    right: `calc(100% / ${sectionsList.length} / 2)`
                  }}
                />
              </div>
            )}

            {/* Children Row: Column wrappers containing stem + card */}
            <div className="flex justify-around items-stretch w-full gap-6 px-4">
              {sectionsList.map((sec, idx) => {
                const sectionNeeds = needs.filter((n) => n.section === sec.id);
                const totalCreated = sectionNeeds.length;
                const fulfilled = sectionNeeds.filter(
                  (n) => n.quantity_received >= n.quantity_required && n.quantity_required > 0
                ).length;
                const fulfilling = sectionNeeds.filter(
                  (n) =>
                    n.quantity_received > 0 &&
                    n.quantity_received < n.quantity_required
                ).length;
                const notStarted = sectionNeeds.filter(
                  (n) => n.quantity_received === 0 && n.quantity_required > 0
                ).length;

                return (
                  <div 
                    key={sec.id} 
                    className="flex-1 max-w-[280px] flex flex-col items-center lobby-animate-child"
                    style={{ animationDelay: `${idx * 0.15 + 1.0}s` }}
                  >
                    {/* Vertical drop line directly above and touching the card */}
                    <div 
                      className="w-px h-6 bg-slate-300 lobby-animate-line-y shrink-0" 
                      style={{ animationDelay: `${idx * 0.15 + 0.8}s` }}
                    />

                    {/* Card container */}
                    <div className="h-full w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer">
                      {/* Section Title & Header */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Layers size={16} />
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-800 text-sm leading-tight">
                              {sec.name}
                            </h5>
                            {sec.head_of_section && (
                              <p className="text-[10px] text-slate-400 font-medium">
                                Head: {sec.head_of_section}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Need Stats Panel */}
                      <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        {/* 1. Created Needs */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <ClipboardList size={13} className="text-slate-400" />
                            Created Needs
                          </span>
                          <span className="px-2 py-0.5 bg-slate-200/60 text-slate-700 font-bold rounded">
                            {totalCreated}
                          </span>
                        </div>

                        {/* 2. Fulfilled (100%) */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-500" />
                            100% Fulfilled
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                            {fulfilled}
                          </span>
                        </div>

                        {/* 3. Fulfilling (In progress) */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <Flame size={13} className="text-amber-500 animate-pulse" />
                            In Progress
                          </span>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded">
                            {fulfilling}
                          </span>
                        </div>

                        {/* 4. Not Started */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <PlayCircle size={13} className="text-slate-400" />
                            Not Started
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-bold rounded">
                            {notStarted}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">
            No sections registered yet for this organization.
          </div>
        )}
      </div>
    </div>
  );
}
