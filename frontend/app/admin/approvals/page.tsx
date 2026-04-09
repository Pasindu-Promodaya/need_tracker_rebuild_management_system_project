'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getAdminApprovals, approveOrgAdmin, rejectOrgAdmin } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Check, X } from 'lucide-react';

interface ApprovalRequest {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  organization_name: string;
  organization_type: string;
  rejection_reason?: string;
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await getAdminApprovals();
      setRequests(data);
    } catch (err: any) {
      setError('Failed to load approval requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveOrgAdmin(id);
      setRequests(requests.filter(r => r.id !== id));
      alert('Admin approved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      await rejectOrgAdmin(id, rejectionReason);
      setRequests(requests.filter(r => r.id !== id));
      setRejectingId(null);
      setRejectionReason('');
      alert('Request rejected successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to reject');
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Access denied. Only system admins can view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Organization Admin Approvals</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No pending approval requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {req.first_name} {req.last_name}
                    </h3>
                    <p className="text-gray-600">{req.email}</p>
                    <p className="text-sm text-gray-500 mt-1">@{req.username}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    req.approval_status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : req.approval_status === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {req.approval_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Organization</label>
                    <p className="text-gray-900">{req.organization_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-gray-900">{req.organization_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{req.phone_number || 'N/A'}</p>
                  </div>
                </div>

                {req.approval_status === 'PENDING' && (
                  <>
                    {rejectingId !== req.id ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          <Check size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                          <X size={18} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Reason for rejection..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReject(req.id)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            Confirm Rejection
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionReason('');
                            }}
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {req.approval_status === 'REJECTED' && req.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {req.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
