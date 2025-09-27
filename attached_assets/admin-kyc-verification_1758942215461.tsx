import React, { useState, useEffect } from 'react';
import { KycReviewModal } from '../components/kyc-review-modal';
import { BatchKycActions } from '../components/batch-kyc-actions';

interface MerchantKycSubmission {
  id: string;
  merchantId: string;
  businessName: string;
  merchantEmail: string;
  documents: any[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface MerchantKycStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface KycDocument {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: 'ID_CARD' | 'PASSPORT' | 'DRIVER_LICENSE' | 'UTILITY_BILL';
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export function AdminKYCVerification() {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [merchantKycSubmissions, setMerchantKycSubmissions] = useState<MerchantKycSubmission[]>([]);
  const [merchantKycStats, setMerchantKycStats] = useState<MerchantKycStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchDocuments();
    fetchMerchantKycSubmissions();
  }, []);

  const fetchMerchantKycSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/merchant-kyc/pending', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMerchantKycSubmissions(data.data?.submissions || []);
        setMerchantKycStats(data.data?.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch merchant KYC submissions:', error);
    }
  };

  const handleMerchantKycReview = async (submissionId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch(`/api/admin/merchant-kyc/${submissionId}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      });

      if (response.ok) {
        await fetchMerchantKycSubmissions();
      }
    } catch (error) {
      console.error('Failed to review merchant KYC:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/kyc/documents', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch KYC documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (filterStatus === 'all') return true;
    return doc.status === filterStatus;
  });

  const pendingCount = documents.filter(doc => doc.status === 'PENDING').length;

  const handleDocumentReview = async (documentId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch(`/api/admin/kyc/documents/${documentId}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: action === 'approve' ? 'APPROVED' : 'REJECTED', 
          reason 
        }),
      });

      if (response.ok) {
        await fetchDocuments();
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error('Failed to review document:', error);
    }
  };

  

  const handleBatchAction = async (action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch('/api/admin/kyc/batch-review', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          documentIds: selectedDocuments, 
          action, 
          reason 
        }),
      });

      if (response.ok) {
        await fetchDocuments();
      }
    } catch (error) {
      console.error('Batch action failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">KYC Verification</h2>
          <p className="text-gray-600">
            {pendingCount} consumer documents | {merchantKycStats.pending || 0} merchant submissions pending
          </p>
        </div>
        {selectedDocuments.length > 0 && (
          <BatchKycActions
            selectedCount={selectedDocuments.length}
            onBatchAction={handleBatchAction}
          />
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedDocuments.length === filteredDocuments.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
                    } else {
                      setSelectedDocuments([]);
                    }
                  }}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDocuments.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(document.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocuments([...selectedDocuments, document.id]);
                      } else {
                        setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{document.userName}</div>
                    <div className="text-sm text-gray-500">{document.userEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {document.documentType.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    document.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    document.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {document.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(document.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedDocument(document)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Merchant KYC Submissions */}
      <div className="bg-white shadow rounded-lg overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Merchant KYC Submissions</h3>
          <p className="text-sm text-gray-600">
            {merchantKycStats.pending || 0} pending submissions
          </p>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {merchantKycSubmissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {submission.businessRegistrationNumber}
                    </div>
                    <div className="text-sm text-gray-500">{submission.businessEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {submission.businessType?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{submission.ownerFullName}</div>
                    <div className="text-sm text-gray-500">{submission.ownerNationalId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    submission.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    submission.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {submission.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleMerchantKycReview(submission.id.toString(), 'approve')}
                    className="text-green-600 hover:text-green-900"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleMerchantKycReview(submission.id.toString(), 'reject', 'Documents incomplete')}
                    className="text-red-600 hover:text-red-900"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      

      {selectedDocument && (
        <KycReviewModal
          document={selectedDocument}
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onReview={handleDocumentReview}
        />
      )}
    </div>
  );
}

export default AdminKYCVerification;