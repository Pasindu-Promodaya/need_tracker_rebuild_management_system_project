"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NeedItem, getNeeds, priorityLabels, createDonation } from "@/lib/api";
import NeedCard from "@/components/NeedCard";
import DonateModal, { type DonationFormData } from "@/components/DonateModal";
import EditNeedModal from "@/components/EditNeedModal";
import { deleteNeed } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import PriorityFilter from "@/components/PriorityFilter";
import { PageLoading } from "@/components/LoadingSpinner";
import "../donor-modal-custom.css";

export default function NeedsPage() {
  const { user } = useAuth();
  const [donateNeed, setDonateNeed] = useState<NeedItem | null>(null);
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState(false);
  const [donateError, setDonateError] = useState("");
  const searchParams = useSearchParams();
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(
    searchParams.get("priority"),
  );
  const [sortBy, setSortBy] = useState<"priority" | "date" | "progress">(
    "priority",
  );
  // Add state for login prompt and only-donor message
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showOnlyDonorMsg, setShowOnlyDonorMsg] = useState(false);
  // Edit/Delete modal state
  const [editNeed, setEditNeed] = useState<NeedItem | null>(null);
  const [deleteNeedItem, setDeleteNeedItem] = useState<NeedItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    async function fetchNeeds() {
      setLoading(true);
      try {
        const data = await getNeeds(priorityFilter || undefined);
        setNeeds(data);
      } catch (error) {
        console.error("Failed to fetch needs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNeeds();
  }, [priorityFilter]);

  // Sort needs safely
  const sortedNeeds = Array.isArray(needs)
    ? [...needs].sort((a, b) => {
        if (sortBy === "priority") {
          const priorityOrder = { CRITICAL: 0, ESSENTIAL: 1, NICE: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (sortBy === "date") {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        if (sortBy === "progress") {
          const progressA =
            a.quantity_required > 0
              ? a.quantity_received / a.quantity_required
              : 0;
          const progressB =
            b.quantity_required > 0
              ? b.quantity_received / b.quantity_required
              : 0;
          return progressA - progressB; // Show least fulfilled first
        }
        return 0;
      })
    : [];

  // Stats
  const stats = {
    total: Array.isArray(needs) ? needs.length : 0,
    critical: Array.isArray(needs)
      ? needs.filter((n) => n.priority === "CRITICAL").length
      : 0,
    essential: Array.isArray(needs)
      ? needs.filter((n) => n.priority === "ESSENTIAL").length
      : 0,
    nice: Array.isArray(needs)
      ? needs.filter((n) => n.priority === "NICE").length
      : 0,
    fulfilled: Array.isArray(needs)
      ? needs.filter((n) => n.quantity_received >= n.quantity_required).length
      : 0,
  };

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Needs</h1>
        <p className="text-gray-500 mt-1">
          View and manage all registered needs across organizations
        </p>
      </div>
      {/* Stats Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Total: <strong>{stats.total}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Critical: <strong>{stats.critical}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Essential: <strong>{stats.essential}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Nice to Have: <strong>{stats.nice}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Fulfilled: <strong>{stats.fulfilled}</strong>
            </span>
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PriorityFilter
          selected={priorityFilter}
          onChange={setPriorityFilter}
        />

        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-gray-600">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "priority" | "date" | "progress")
            }
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="priority">Priority</option>
            <option value="date">Most Recent</option>
            <option value="progress">Least Fulfilled</option>
          </select>
        </div>
      </div>
      {/* Results */}
      {priorityFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {sortedNeeds.length}{" "}
            {priorityLabels[priorityFilter as keyof typeof priorityLabels]}{" "}
            needs
          </span>
          <button
            onClick={() => setPriorityFilter(null)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear filter
          </button>
        </div>
      )}
      {/* Needs Grid */}
      {sortedNeeds.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {sortedNeeds.map((need) => {
            // Only show Edit/Delete for ADMIN or ORG_ADMIN
            const canEditDelete =
              user && (user.role === "ADMIN" || user.role === "ORG_ADMIN");
            return (
              <NeedCard
                key={need.id}
                need={need}
                showDonateButton={!user || user.role === "DONOR"}
                onDonate={() => {
                  if (!user) {
                    setShowLoginPrompt(true);
                  } else if (user.role !== "DONOR") {
                    setShowOnlyDonorMsg(true);
                  } else {
                    setDonateNeed(need);
                  }
                }}
                onEdit={canEditDelete ? () => setEditNeed(need) : undefined}
                onDelete={
                  canEditDelete ? () => setDeleteNeedItem(need) : undefined
                }
              />
            );
          })}
          {/* Edit Need Modal */}
          {editNeed && (
            <EditNeedModal
              need={editNeed}
              onClose={() => setEditNeed(null)}
              onSuccess={async () => {
                // Refresh needs after edit
                const data = await getNeeds(priorityFilter || undefined);
                setNeeds(data);
              }}
            />
          )}

          {/* Delete Need Confirmation Modal */}
          {deleteNeedItem && (
            <div className="modal-overlay donor-modal-overlay">
              <div className="modal donor-modal-custom">
                <h2 className="text-xl font-bold mb-3 text-red-700">
                  Confirm Delete
                </h2>
                <p className="mb-5 text-gray-700 text-sm">
                  Are you sure you want to delete <b>{deleteNeedItem.name}</b>?
                </p>
                {deleteError && (
                  <div className="text-red-600 mb-2">{deleteError}</div>
                )}
                <div className="flex gap-2 justify-center">
                  <button
                    className="donor-btn-primary bg-red-600 hover:bg-red-700"
                    disabled={deleteLoading}
                    onClick={async () => {
                      setDeleteLoading(true);
                      setDeleteError("");
                      try {
                        await deleteNeed(deleteNeedItem.id);
                        // Refresh needs after delete
                        const data = await getNeeds(
                          priorityFilter || undefined,
                        );
                        setNeeds(data);
                        setDeleteNeedItem(null);
                      } catch (err: any) {
                        setDeleteError(err.message || "Failed to delete");
                      } finally {
                        setDeleteLoading(false);
                      }
                    }}
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    className="donor-btn-cancel"
                    disabled={deleteLoading}
                    onClick={() => setDeleteNeedItem(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Needs Found
          </h3>
          <p className="text-gray-500">
            {priorityFilter
              ? `No ${priorityLabels[priorityFilter as keyof typeof priorityLabels]} needs registered`
              : "No needs have been registered yet"}
          </p>
        </div>
      )}
      {user?.role === "DONOR" && donateNeed && (
        <DonateModal
          need={donateNeed}
          isOpen={!!donateNeed}
          onClose={() => {
            setDonateNeed(null);
            setDonateError("");
            setDonateSuccess(false);
          }}
          onSubmit={async (donationData: DonationFormData) => {
            setDonateLoading(true);
            setDonateError("");
            setDonateSuccess(false);
            try {
              await createDonation({
                need_item: donateNeed.id,
                quantity: donationData.quantity,
                message: donationData.message,
                donor: user?.id || null,
                donor_type: donationData.donorType,
                donor_name: donationData.donorName,
                donor_contact: donationData.donorContact,
                donor_organization: donationData.donorOrganization,
                donor_address: donationData.donorAddress,
                donor_email: donationData.donorEmail,
                donor_phone: donationData.donorPhone,
                government_department: donationData.governmentDepartment,
                government_program: donationData.governmentProgram,
                government_officer_name: donationData.governmentOfficerName,
                government_officer_designation:
                  donationData.governmentOfficerDesignation,
                government_officer_contact:
                  donationData.governmentOfficerContact,
                estimated_delivery_date: donationData.estimatedDeliveryDate,
              });
              setDonateSuccess(true);
              // Refresh needs after donation and close modal only after update
              const data = await getNeeds(priorityFilter || undefined);
              setNeeds(data);
              setDonateNeed(null);
              setDonateSuccess(false);
            } catch (err: any) {
              setDonateError(err.message || "Failed to pledge donation");
            } finally {
              setDonateLoading(false);
            }
          }}
        />
      )}
      {/* Login prompt modal for unauthenticated users */}
      {showLoginPrompt && (
        <div className="modal-overlay donor-modal-overlay">
          <div className="modal donor-modal-custom">
            <svg
              className="mx-auto mb-3"
              width="40"
              height="40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#fbbf24"
              strokeWidth="2"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#fbbf24"
                strokeWidth="2"
                fill="#fef3c7"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01"
              />
            </svg>
            <h2 className="text-xl font-extrabold mb-1 text-yellow-700">
              Only Donors Can Donate
            </h2>
            <p className="mb-5 text-gray-700 text-sm">
              You must have a donor account to donate to a need.
            </p>
            <div className="flex gap-2 justify-center">
              <a href="/login?tab=register" className="donor-btn-primary">
                Register as Donor
              </a>
              <button
                className="donor-btn-cancel"
                onClick={() => setShowLoginPrompt(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Only donors can donate modal */}
      {showOnlyDonorMsg && (
        <div className="modal-overlay donor-modal-overlay">
          <div className="modal donor-modal-custom">
            <h2 className="text-2xl font-bold mb-3 text-yellow-700">
              Only Donors Can Donate
            </h2>
            <p className="mb-6 text-gray-700">
              You must have a donor account to donate to a need.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="donor-btn-primary"
                onClick={() => setShowOnlyDonorMsg(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
