"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Donation, getDonations } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CheckCircle2, XCircle, Clock, Gift } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("PENDING");
  const [confirming, setConfirming] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDonations = async () => {
      if (!user || user.role !== "ADMIN") return;

      try {
        setIsLoading(true);
        setError("");
        const data = await getDonations();
        setDonations(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch donations");
        console.error("Error fetching donations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, [user]);

  const handleConfirm = async (donationId: number) => {
    setConfirming(donationId);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/donations/${donationId}/confirm/`,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to confirm donation");
    } finally {
      setConfirming(null);
    }
  };

  const handleCancel = async (donationId: number) => {
    setCancelling(donationId);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/donations/${donationId}/cancel/`,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel donation");
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

  const filteredDonations =
    filter === "ALL" ? donations : donations.filter((d) => d.status === filter);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
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
                {status}
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
            <div key={status} className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm font-medium">{status}</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {donations.filter((d) => d.status === status).length}
              </div>
              <div className="text-gray-600 text-sm mt-2">
                Total:{" "}
                {donations
                  .filter((d) => d.status === status)
                  .reduce((sum, d) => sum + d.quantity, 0)}{" "}
                units
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
