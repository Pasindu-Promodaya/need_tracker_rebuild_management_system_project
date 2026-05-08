"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Donation, getDonations, getOrganizations } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CheckCircle2, XCircle, Clock, Gift } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DonationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("PENDING");
  const [confirming, setConfirming] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [needsMap, setNeedsMap] = useState<Map<number, any>>(new Map());
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== "ADMIN" && user?.role !== "ORG_ADMIN") {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  const fetchDonations = async () => {
    if (!user || user.role !== "ORG_ADMIN") return;

    try {
      setError("");
      const data = await getDonations();
      // Sort donations by most recent completely
      const sortedData = [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setDonations(sortedData);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch donations",
      );
      console.error("Error fetching donations:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      if (user.role !== "ORG_ADMIN" && user.role !== "ADMIN") return;

      try {
        setIsLoading(true);
        setError("");

        // Get all donations
        const allDonations = await getDonations();

        if (user.role === "ADMIN") {
          // Admins see everything
          setDonations(allDonations);

          // Optionally get some extra info for admins
          const orgs = await getOrganizations();
          const nMap = new Map<number, any>();
          orgs.forEach((org: any) => {
            org.sections?.forEach((section: any) => {
              section.needs?.forEach((need: any) => {
                nMap.set(need.id, need);
              });
            });
          });
          setNeedsMap(nMap);
        } else {
          // ORG_ADMIN logic
          const orgs = await getOrganizations();
          if (orgs.length > 0) {
            setOrganization(orgs[0]);

            const nMap = new Map<number, any>();
            orgs[0].sections?.forEach((section: any) => {
              section.needs?.forEach((need: any) => {
                nMap.set(need.id, need);
              });
            });
            setNeedsMap(nMap);

            const orgNeedIds = new Set<number>();
            orgs[0].sections?.forEach((section: any) => {
              section.needs?.forEach((need: any) => {
                orgNeedIds.add(need.id);
              });
            });

            const filteredDonations = allDonations.filter((d) =>
              orgNeedIds.has(d.need_item),
            );
            setDonations(filteredDonations);
          }
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
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/donations/${donationId}/confirm/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        await fetchDonations();
      } else {
        const data = await response.json();
        setError(data.status || "Failed to confirm donation");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm donation",
      );
    } finally {
      setConfirming(null);
    }
  };

  const handleCancel = async (donationId: number) => {
    setCancelling(donationId);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/donations/${donationId}/cancel/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        await fetchDonations();
      } else {
        const data = await response.json();
        setError(data.status || "Failed to cancel donation");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel donation",
      );
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

  // Group fulfilled donations by need item
  const groupDonationsByNeedItem = (
    donations: Donation[],
  ): Record<number, Donation[]> => {
    return donations.reduce(
      (groups, donation) => {
        const needId = donation.need_item;
        if (!groups[needId]) {
          groups[needId] = [];
        }
        groups[needId].push(donation);
        return groups;
      },
      {} as Record<number, Donation[]>,
    );
  };

  const filteredDonations = (() => {
    let result = [];
    if (filter === "ALL") result = donations;
    else if (filter === "CONFIRMED")
      result = donations.filter(
        (d) => d.status === "CONFIRMED" || d.status === "FULFILLED",
      );
    else result = donations.filter((d) => d.status === filter);

    // Ensure the array is always sorted newest-first
    return result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  })();

  // For FULFILLED filter, group by need item
  const groupedFulfilledDonations =
    filter === "FULFILLED"
      ? groupDonationsByNeedItem(
          donations.filter((d) => d.status === "FULFILLED"),
        )
      : {};

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (user?.role !== "ADMIN" && user?.role !== "ORG_ADMIN") {
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
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
            (status) => {
              let count = 0;
              if (status === "ALL") {
                count = donations.length;
              } else if (status === "CONFIRMED") {
                count = donations.filter(
                  (d) => d.status === "CONFIRMED" || d.status === "FULFILLED",
                ).length;
              } else if (status === "FULFILLED") {
                // Count unique need items for FULFILLED tab
                const fulfilledDonations = donations.filter(
                  (d) => d.status === "FULFILLED",
                );
                const uniqueNeeds = new Set(
                  fulfilledDonations.map((d) => d.need_item),
                );
                count = uniqueNeeds.size;
              } else {
                count = donations.filter((d) => d.status === status).length;
              }

              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-3 font-medium border-b-2 transition ${
                    filter === status
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 border-transparent hover:text-gray-900"
                  }`}
                >
                  {status}
                  {status !== "ALL" && (
                    <span className="ml-2 text-sm">({count})</span>
                  )}
                </button>
              );
            },
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
                  {filter === "FULFILLED"
                    ? // For FULFILLED donations, group by need item and show all donors
                      Object.entries(groupedFulfilledDonations)
                        .sort(
                          ([, a], [, b]) =>
                            new Date(b[0].created_at).getTime() -
                            new Date(a[0].created_at).getTime(),
                        )
                        .map(([needId, needDonations]) => {
                          const firstDonation = needDonations[0];
                          const totalQuantity = needDonations.reduce(
                            (sum, d) => sum + d.quantity,
                            0,
                          );
                          return (
                            <tr
                              key={needId}
                              className="hover:bg-gray-50 transition"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon("FULFILLED")}
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge("FULFILLED")}`}
                                  >
                                    FULFILLED
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div className="font-medium text-gray-900">
                                  {firstDonation.need_item_detail?.name ||
                                    `Need ${firstDonation.need_item}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                <div className="space-y-2">
                                  {needDonations.map((donation, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center py-1"
                                    >
                                      {donation.quantity}{" "}
                                      {donation.need_item_detail?.unit ||
                                        "units"}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div className="space-y-2">
                                  {needDonations.map((donation, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center py-1"
                                    >
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${donation.donor_type === "private" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                                      >
                                        {donation.donor_type === "private"
                                          ? "Private"
                                          : "Government"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div className="space-y-2">
                                  {needDonations.map((donation, idx) => (
                                    <div key={idx} className="py-1">
                                      <div className="text-gray-900 font-medium text-xs">
                                        {donation.donor_type === "private"
                                          ? donation.donor_name
                                          : donation.government_department}
                                      </div>
                                      {donation.donor_type === "private" && (
                                        <div className="text-gray-500 text-[10px]">
                                          {donation.donor_email}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                <div className="space-y-2">
                                  {needDonations.map((donation, idx) => (
                                    <div
                                      key={idx}
                                      className="py-1 flex items-center whitespace-nowrap text-xs"
                                    >
                                      {new Date(
                                        donation.created_at,
                                      ).toLocaleDateString()}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className="text-gray-500 text-xs">
                                  No actions
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    : // For other statuses, show one row per donation
                      filteredDonations.map((donation) => {
                        const displayStatus =
                          filter === "CONFIRMED"
                            ? "CONFIRMED"
                            : donation.status;
                        return (
                          <tr
                            key={donation.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(displayStatus)}
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(displayStatus)}`}
                                >
                                  {displayStatus}
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
                                className={`px-3 py-1 rounded-full text-xs font-medium ${donation.donor_type === "private" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
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
                              {new Date(
                                donation.created_at,
                              ).toLocaleDateString()}
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
                                {donation.status === "CONFIRMED" && (
                                  <span className="text-gray-500 text-xs">
                                    No actions
                                  </span>
                                )}
                                {donation.status !== "PENDING" &&
                                  donation.status !== "CONFIRMED" && (
                                    <span className="text-gray-500 text-xs">
                                      No actions
                                    </span>
                                  )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-6 mt-8">
          {["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"].map((status) => {
            let count = 0;
            let totalQuantity = 0;

            if (status === "CONFIRMED") {
              const confirmedAndFulfilled = donations.filter(
                (d) => d.status === "CONFIRMED" || d.status === "FULFILLED",
              );
              count = confirmedAndFulfilled.length;
              totalQuantity = confirmedAndFulfilled.reduce(
                (sum, d) => sum + d.quantity,
                0,
              );
            } else if (status === "FULFILLED") {
              const fulfilledDonations = donations.filter(
                (d) => d.status === "FULFILLED",
              );
              const uniqueNeeds = new Set(
                fulfilledDonations.map((d) => d.need_item),
              );
              count = uniqueNeeds.size;
              totalQuantity = fulfilledDonations.reduce(
                (sum, d) => sum + d.quantity,
                0,
              );
            } else {
              const standardDonations = donations.filter(
                (d) => d.status === status,
              );
              count = standardDonations.length;
              totalQuantity = standardDonations.reduce(
                (sum, d) => sum + d.quantity,
                0,
              );
            }

            return (
              <div key={status} className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-600 text-sm font-medium">
                  {status}
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {count}
                </div>
                <div className="text-gray-600 text-sm mt-2">
                  Total: {totalQuantity} units
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
