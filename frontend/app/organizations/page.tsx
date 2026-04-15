"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Organization,
  getOrganizations,
  deleteOrganization,
  NeedItem,
  Section,
  deleteNeed,
  deleteSection,
} from "@/lib/api";
import { PageLoading } from "@/components/LoadingSpinner";
import { useAdminGuard } from "@/lib/useAuthGuard";
import SectionAccordion from "@/components/SectionAccordion";
import AddSectionModal from "@/components/AddSectionModal";
import ManualNeedEntryForm from "@/components/ManualNeedEntryForm";
import EditNeedModal from "@/components/EditNeedModal";
import EditSectionModal from "@/components/EditSectionModal";

export default function OrganizationsPage() {
  const router = useRouter();
  const { authorized, isLoading: authLoading } = useAdminGuard();
  const isAdmin = authorized;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [addNeedForSection, setAddNeedForSection] = useState<{
    orgId: number;
    sectionId: number;
  } | null>(null);
  const [editNeed, setEditNeed] = useState<NeedItem | null>(null);
  const [deleteNeedConfirm, setDeleteNeedConfirm] = useState<NeedItem | null>(
    null,
  );
  const [deletingNeed, setDeletingNeed] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);

  const fetchOrganization = useCallback(async () => {
    try {
      const orgs = await getOrganizations();
      setOrganization(orgs.length > 0 ? orgs[0] : null);
    } catch (err) {
      setOrganization(null);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    fetchOrganization();
    setLoading(false);
  }, [authorized, fetchOrganization]);

  const findNeedById = (needId: number): NeedItem | null => {
    if (!organization?.sections) return null;
    for (const section of organization.sections) {
      const found = section.needs?.find((n) => n.id === needId);
      if (found) return found;
    }
    return null;
  };

  async function handleDeleteNeed(needId: number) {
    setDeletingNeed(true);
    try {
      await deleteNeed(needId);
      setDeleteNeedConfirm(null);
      setLoading(true);
      await fetchOrganization();
      setLoading(false);
    } catch {
      alert("Failed to delete need. Please try again.");
    } finally {
      setDeletingNeed(false);
    }
  }

  async function handleDeleteSection(sectionId: number) {
    try {
      await deleteSection(sectionId);
      setLoading(true);
      await fetchOrganization();
      setLoading(false);
    } catch {
      alert("Failed to delete section. Please try again.");
    }
  }

  const handleDelete = async () => {
    if (!organization) return;
    setDeleting(true);
    try {
      await deleteOrganization(organization.id);
      setOrganization(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Failed to delete organization:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || !authorized || loading) return <PageLoading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization</h1>
          <p className="text-gray-500 mt-1">
            {organization
              ? "Manage your registered organization"
              : "No organization registered yet"}
          </p>
        </div>

        {/* Action Buttons */}
        {organization && (
          <div className="flex items-center gap-3">
            <Link
              href={`/organizations/${organization.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Organization
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Organization
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {organization ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 transition-all">
          {/* Header with Icon and Basic Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-7 h-7 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {organization.name}
              </h2>
              <div className="flex flex-wrap gap-3">
                {organization.org_type && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                    {organization.org_type}
                  </span>
                )}
                {organization.established_year && (
                  <span className="text-sm text-gray-500">
                    Est: {organization.established_year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Core Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
            {/* Registration & Location */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Registration
              </h3>
              <p className="text-gray-900 font-medium">
                {organization.registration_number}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                District
              </h3>
              <p className="text-gray-900 font-medium">
                {organization.district}
              </p>
            </div>

            {/* Address */}
            {organization.address && (
              <div className="md:col-span-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Address
                </h3>
                <p className="text-gray-900">{organization.address}</p>
              </div>
            )}
          </div>

          {/* Contact Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-100">
            {organization.phone && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Phone
                </h3>
                <a
                  href={`tel:${organization.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {organization.phone}
                </a>
              </div>
            )}
            {organization.email_contact && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Email
                </h3>
                <a
                  href={`mailto:${organization.email_contact}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {organization.email_contact}
                </a>
              </div>
            )}
            {organization.website && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Website
                </h3>
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-700 font-medium truncate"
                >
                  {organization.website}
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {organization.description && (
            <div className="mb-6 pb-6 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                About
              </h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                {organization.description}
              </p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {organization.sections?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Sections</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {organization.sections?.reduce(
                  (a, s) => a + (s.needs?.length || 0),
                  0,
                ) || 0}
              </p>
              <p className="text-xs text-gray-500">Total Needs</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {organization.sections?.reduce(
                  (a, s) =>
                    a +
                    (s.needs?.filter((n) => n.priority === "CRITICAL").length ||
                      0),
                  0,
                ) || 0}
              </p>
              <p className="text-xs text-gray-500">Critical</p>
            </div>
          </div>

          {/* Sections & Needs */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Sections & Needs
              </h2>
              {isAdmin && (
                <button
                  onClick={() => setShowAddSection(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Section
                </button>
              )}
            </div>

            {organization.sections && organization.sections.length > 0 ? (
              <div className="space-y-4">
                {organization.sections.map((section, index) => (
                  <SectionAccordion
                    key={section.id}
                    section={section}
                    defaultOpen={index === 0}
                    onAddNeed={
                      isAdmin
                        ? () =>
                            setAddNeedForSection({
                              orgId: organization.id,
                              sectionId: section.id,
                            })
                        : undefined
                    }
                    onEditNeed={
                      isAdmin
                        ? (needId) => {
                            const n = findNeedById(needId);
                            if (n) setEditNeed(n);
                          }
                        : undefined
                    }
                    onDeleteNeed={
                      isAdmin
                        ? (needId) => {
                            const n = findNeedById(needId);
                            if (n) setDeleteNeedConfirm(n);
                          }
                        : undefined
                    }
                    onEditSection={
                      isAdmin ? () => setEditSection(section) : undefined
                    }
                    onDeleteSection={
                      isAdmin
                        ? () => handleDeleteSection(section.id)
                        : undefined
                    }
                  />
                ))}
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Sections Yet
                </h3>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Organization Yet
          </h3>
          <p className="text-gray-500 mb-6">
            No organization has been registered in the system.
          </p>
          <Link
            href="/organizations/new"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Organization
          </Link>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSection && organization && (
        <AddSectionModal
          organizationId={organization.id}
          onClose={() => setShowAddSection(false)}
          onSuccess={() => {
            setShowAddSection(false);
            setLoading(true);
            fetchOrganization();
          }}
        />
      )}

      {/* Manual Need Entry Form (for adding needs) */}
      {addNeedForSection && organization && (
        <ManualNeedEntryForm
          initialOrgId={organization.id}
          initialSectionId={addNeedForSection.sectionId}
          onClose={() => setAddNeedForSection(null)}
          onSuccess={() => {
            setAddNeedForSection(null);
            setLoading(true);
            fetchOrganization();
          }}
        />
      )}

      {/* Edit Need Modal */}
      {editNeed && (
        <EditNeedModal
          need={editNeed}
          onClose={() => setEditNeed(null)}
          onSuccess={() => {
            setEditNeed(null);
            setLoading(true);
            fetchOrganization();
          }}
        />
      )}

      {/* Delete Need Confirmation */}
      {deleteNeedConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setDeleteNeedConfirm(null)}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Need
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "
                <strong>{deleteNeedConfirm.name}</strong>"?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteNeedConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteNeed(deleteNeedConfirm.id)}
                  disabled={deletingNeed}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deletingNeed ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editSection && organization && (
        <EditSectionModal
          section={editSection}
          onClose={() => setEditSection(null)}
          onSuccess={() => {
            setEditSection(null);
            setLoading(true);
            fetchOrganization();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Organization
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <strong>{organization?.name}</strong>? All sections and needs
                will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
