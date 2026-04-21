"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Donation, getDonations, getOrganizations } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CheckCircle2, XCircle, Clock, Gift, X } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "../donations.module.css";

export default function DonationManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("PENDING");
  const [confirming, setConfirming] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [showFulfilledModal, setShowFulfilledModal] = useState(false);
  const [needsMap, setNeedsMap] = useState<Map<number, any>>(new Map());

  useEffect(() => {
    if (!authLoading) {
      if (user?.role === "ADMIN") {
        router.push("/admin");
      } else if (user?.role !== "ORG_ADMIN") {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== "ORG_ADMIN") return;

      try {
        setIsLoading(true);
        setError("");

        // Get organization
        const orgs = await getOrganizations();
        if (orgs.length > 0) {
          setOrganization(orgs[0]);

          // Build needs map for quick lookup
          const nMap = new Map<number, any>();
          orgs[0].sections?.forEach((section: any) => {
            section.needs?.forEach((need: any) => {
              nMap.set(need.id, need);
            });
          });
          setNeedsMap(nMap);
        }

        // Get all donations
        const allDonations = await getDonations();

        // Filter donations for this organization's needs
        if (orgs.length > 0) {
          const orgId = orgs[0].id;
          const orgNeedIds = new Set<number>();

          // Collect all need IDs for this organization
          orgs[0].sections?.forEach((section: any) => {
            section.needs?.forEach((need: any) => {
              orgNeedIds.add(need.id);
            });
          });

          // Filter donations to only show those for this organization's needs
          const filteredDonations = allDonations.filter((d) =>
            orgNeedIds.has(d.need_item),
          );

          setDonations(filteredDonations);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch donations");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleConfirm = async (donationId: number) => {
    setConfirming(donationId);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:8000/api/donations/${donationId}/confirm/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setDonations(
          donations.map((d) =>
            d.id === donationId ? { ...d, status: "CONFIRMED" } : d,
          ),
        );
      } else {
        const data = await response.json();
        setError(data.status || "Failed to confirm donation");
      }
    } catch (err: any) {
      setError(err.message || "Failed to confirm donation");
    } finally {
      setConfirming(null);
    }
  };

  const handleCancel = async (donationId: number) => {
    setCancelling(donationId);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:8000/api/donations/${donationId}/cancel/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setDonations(
          donations.map((d) =>
            d.id === donationId ? { ...d, status: "CANCELLED" } : d,
          ),
        );
      } else {
        const data = await response.json();
        setError(data.status || "Failed to cancel donation");
      }
    } catch (err: any) {
      setError(err.message || "Failed to cancel donation");
    } finally {
      setCancelling(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle2 className="text-green-600" size={20} />;
      case "CANCELLED":
        return <XCircle className="text-red-600" size={20} />;
      case "FULFILLED":
        return <Gift className="text-purple-600" size={20} />;
      default:
        return <Clock className="text-yellow-600" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "FULFILLED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatStatusDisplay = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
      FULFILLED: "Fulfilled",
      CANCELLED: "Cancelled",
      ALL: "All",
    };
    return statusMap[status] || status;
  };

  const filteredDonations =
    filter === "ALL" ? donations : donations.filter((d) => d.status === filter);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (user?.role !== "ORG_ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Donation Management
          </h1>
          <p className="text-gray-600 mt-2">
            Review and confirm donations from donors
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
            {error}
            <button
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED", "ALL"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-3 font-medium border-b-2 transition ${
                  filter === status
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                {formatStatusDisplay(status)}
                {status !== "ALL" && (
                  <span className="ml-2 text-sm">
                    ({donations.filter((d) => d.status === status).length})
                  </span>
                )}
              </button>
            ),
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredDonations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No donations found for this filter
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Need Item
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Donor Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Donor Info
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDonations.map((donation) => (
                    <tr
                      key={donation.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(donation.status)}
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(donation.status)}`}
                          >
                            {donation.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {donation.need_item_detail?.name ||
                            `Need ${donation.need_item}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {donation.quantity}{" "}
                        {donation.need_item_detail?.unit || "units"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            donation.donor_type === "private"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {donation.donor_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900 font-medium">
                          {donation.donor_type === "private"
                            ? donation.donor_name
                            : donation.government_department}
                        </div>
                        {donation.donor_type === "private" && (
                          <div className="text-gray-600 text-xs">
                            {donation.donor_email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(donation.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {donation.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleConfirm(donation.id)}
                                disabled={confirming === donation.id}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs font-medium transition"
                              >
                                {confirming === donation.id
                                  ? "Confirming..."
                                  : "Confirm"}
                              </button>
                              <button
                                onClick={() => handleCancel(donation.id)}
                                disabled={cancelling === donation.id}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-xs font-medium transition"
                              >
                                {cancelling === donation.id
                                  ? "Cancelling..."
                                  : "Cancel"}
                              </button>
                            </>
                          )}
                          {donation.status !== "PENDING" && (
                            <span className="text-gray-500 text-xs">
                              No actions
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-6 mt-8">
          {["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"].map((status) => (
            <div
              key={status}
              onClick={() => {
                if (status === "FULFILLED") {
                  setShowFulfilledModal(true);
                }
              }}
              className={`bg-white rounded-lg shadow p-6 ${
                status === "FULFILLED"
                  ? "cursor-pointer hover:shadow-lg transition"
                  : ""
              }`}
            >
              <div className="text-gray-600 text-sm font-medium">
                {formatStatusDisplay(status)}
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {status === "FULFILLED"
                  ? Array.from(needsMap.values()).filter((need) => {
                      const remaining =
                        need.quantity_required - need.quantity_received;
                      return remaining <= 0;
                    }).length
                  : donations.filter((d) => d.status === status).length}
              </div>
              <div className="text-gray-600 text-sm mt-2">
                Total:{" "}
                {status === "FULFILLED"
                  ? Array.from(needsMap.values())
                      .filter((need) => {
                        const remaining =
                          need.quantity_required - need.quantity_received;
                        return remaining <= 0;
                      })
                      .reduce((sum, need) => sum + need.quantity_required, 0)
                  : donations
                      .filter((d) => d.status === status)
                      .reduce((sum, d) => sum + d.quantity, 0)}{" "}
                units
              </div>
              {status === "FULFILLED" && (
                <div className="text-blue-600 text-xs mt-3 font-semibold">
                  View History →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Fulfilled Donations Modal */}
        {showFulfilledModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Fulfilled Donations History
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Completed and delivered donations
                  </p>
                </div>
                <button
                  onClick={() => setShowFulfilledModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close fulfilled donations history"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto flex-1 p-6">
                {Array.from(needsMap.values()).filter((need) => {
                  const remaining =
                    need.quantity_required - need.quantity_received;
                  return remaining <= 0;
                }).length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    No fulfilled needs yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from(needsMap.values())
                      .filter((need) => {
                        const remaining =
                          need.quantity_required - need.quantity_received;
                        return remaining <= 0;
                      })
                      .map((need) => {
                        const remaining =
                          need.quantity_required - need.quantity_received;
                        const percentComplete = Math.min(
                          100,
                          Math.round(
                            (need.quantity_received / need.quantity_required) *
                              100,
                          ),
                        );
                        const priorityColorMap: Record<string, string> = {
                          CRITICAL: "border-red-200 bg-red-50",
                          ESSENTIAL: "border-orange-200 bg-orange-50",
                          NICE: "border-green-200 bg-green-50",
                        };
                        const priorityColor =
                          priorityColorMap[need.priority] || "border-gray-200";

                        const priorityBadgeColorMap: Record<string, string> = {
                          CRITICAL: "bg-red-100 text-red-800",
                          ESSENTIAL: "bg-orange-100 text-orange-800",
                          NICE: "bg-green-100 text-green-800",
                        };
                        const priorityBadgeColor =
                          priorityBadgeColorMap[need.priority];

                        return (
                          <div
                            key={need.id}
                            className={`border rounded-lg p-4 ${priorityColor}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {need.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {need.section_detail?.name}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${priorityBadgeColor}`}
                              >
                                {need.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {need.description}
                            </p>
                            <div className="mb-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  Progress
                                </span>
                                <span className="text-sm font-medium text-gray-700">
                                  {percentComplete}%
                                </span>
                              </div>
                              <div className={styles.progressBar}>
                                <div
                                  className={styles.progressFill}
                                  data-progress-width={percentComplete}
                                />
                              </div>
                            </div>
                            <div className="flex justify-between text-sm mb-3">
                              <span className="text-green-600 font-medium">
                                Received: {need.quantity_received} {need.unit}
                              </span>
                              <span className="text-gray-600">
                                Needed: {Math.max(0, remaining)} {need.unit}
                              </span>
                            </div>
                            <div className="bg-green-100 border border-green-300 rounded px-3 py-2 text-center">
                              <p className="text-sm font-semibold text-green-700">
                                ✓ Requirement Fulfilled
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
                <button
                  onClick={() => setShowFulfilledModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
