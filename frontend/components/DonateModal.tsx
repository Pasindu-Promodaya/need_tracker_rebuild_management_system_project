"use client";

import { useState, useEffect, useRef } from "react";
import {
  NeedItem,
  getSection,
  getOrganization,
  Section,
  Organization,
} from "@/lib/api";
import { DonationLetterTemplate } from "./DonationLetterTemplate";
import {
  generateDonationLetterPDF,
  convertLetterToBlob,
} from "@/lib/pdfGenerator";

interface DonateModalProps {
  need: NeedItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (donationData: DonationFormData) => void;
}

export interface DonationFormData {
  quantity: number;
  message?: string;
  donorType: "private" | "government";
  donorName?: string;
  donorContact?: string;
  donorOrganization?: string;
  donorAddress?: string;
  donorEmail?: string;
  donorPhone?: string;
  governmentDepartment?: string;
  governmentProgram?: string;
  governmentOfficerName?: string;
  governmentOfficerDesignation?: string;
  governmentOfficerContact?: string;
  estimatedDeliveryDate?: string;
  confirmApproval: boolean;
  letterFile?: File;
}

export default function DonateModal({
  need,
  isOpen,
  onClose,
  onSubmit,
}: DonateModalProps) {
  const [donorType, setDonorType] = useState<"private" | "government">(
    "private",
  );
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [confirmApproval, setConfirmApproval] = useState(false);
  const [error, setError] = useState("");
  const [section, setSection] = useState<Section | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Private Citizen/NGO/Corporate fields
  const [donorName, setDonorName] = useState("");
  const [donorContact, setDonorContact] = useState("");
  const [donorOrganization, setDonorOrganization] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");

  // Government Sponsor fields
  const [governmentDepartment, setGovernmentDepartment] = useState("");
  const [governmentProgram, setGovernmentProgram] = useState("");
  const [governmentOfficerName, setGovernmentOfficerName] = useState("");
  const [governmentOfficerDesignation, setGovernmentOfficerDesignation] =
    useState("");
  const [governmentOfficerContact, setGovernmentOfficerContact] = useState("");

  // Donation letter fields
  const [referenceNumber, setReferenceNumber] = useState("");
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch section and organization details
  useEffect(() => {
    if (!isOpen) return;

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const sectionData = await getSection(need.section);
        setSection(sectionData);
        const orgData = await getOrganization(sectionData.organization);
        setOrganization(orgData);
      } catch (err) {
        console.error("Failed to fetch section/organization details:", err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();

    // Generate reference number
    const timestamp = new Date().getTime().toString().slice(-8);
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setReferenceNumber(`DONATION-${timestamp}-${randomId}`);
    setLetterFile(null);
    setShowLetterPreview(false);
  }, [isOpen, need.section]);

  if (!isOpen) return null;

  const maxQuantity = need.quantity_required - need.quantity_received;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (quantity < 1 || quantity > maxQuantity) {
      setError(`Please enter a quantity between 1 and ${maxQuantity}`);
      return;
    }

    if (!estimatedDeliveryDate) {
      setError("Please provide an estimated delivery date");
      return;
    }

    if (!confirmApproval) {
      setError(
        donorType === "private"
          ? "Please confirm your commitment"
          : "Please confirm that official approval has been granted",
      );
      return;
    }

    // Validate based on donor type
    if (donorType === "private") {
      if (!donorName || !donorContact) {
        setError("Please provide your name and contact information");
        return;
      }
      if (!donorEmail || !donorPhone) {
        setError("Please provide your email and phone number");
        return;
      }
    } else {
      if (!governmentDepartment || !governmentProgram) {
        setError(
          "Please provide government department and program information",
        );
        return;
      }
      if (
        !governmentOfficerName ||
        !governmentOfficerDesignation ||
        !governmentOfficerContact
      ) {
        setError("Please provide authorized officer information");
        return;
      }
    }

    // Validate donation letter file (mandatory)
    if (!letterFile) {
      setError(
        "Please upload the signed donation confirmation letter before submitting",
      );
      return;
    }

    setError("");
    onSubmit({
      quantity,
      message,
      donorType,
      donorName,
      donorContact,
      donorOrganization,
      donorAddress,
      donorEmail,
      donorPhone,
      governmentDepartment,
      governmentProgram,
      governmentOfficerName,
      governmentOfficerDesignation,
      governmentOfficerContact,
      estimatedDeliveryDate,
      confirmApproval,
      letterFile,
    });
  };

  return (
    <div className="pledge-modal-overlay">
      <div className="pledge-modal-container">
        <button
          onClick={onClose}
          className="pledge-modal-close-btn"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="pledge-modal-header">
          <h2 className="pledge-modal-title">Pledge to Supply Items</h2>
        </div>

        <div className="pledge-target-info">
          <p className="pledge-target-line">
            <strong>Target Request:</strong> {need.name}
          </p>
          {organization && (
            <p className="pledge-target-line">
              <strong>Organization:</strong> {organization.name}
            </p>
          )}
          {section && (
            <p className="pledge-target-line">
              <strong>Section:</strong> {section.name}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="pledge-form">
          {/* 1. DONOR TYPE */}
          <div className="pledge-section">
            <h3 className="pledge-section-title">1. DONOR TYPE</h3>
            <div className="pledge-radio-group">
              <label className="pledge-radio-label">
                <input
                  type="radio"
                  value="private"
                  checked={donorType === "private"}
                  onChange={(e) => setDonorType(e.target.value as "private")}
                  className="pledge-radio-input"
                  aria-label="Select Private Citizen / NGO / Corporate donor type"
                />
                <span className="pledge-radio-text">
                  Private Citizen / NGO / Corporate
                </span>
              </label>
              <label className="pledge-radio-label">
                <input
                  type="radio"
                  value="government"
                  checked={donorType === "government"}
                  onChange={(e) => setDonorType(e.target.value as "government")}
                  className="pledge-radio-input"
                  aria-label="Government Sponsor donor type"
                />
                <span className="pledge-radio-text">Government Sponsor</span>
              </label>
            </div>
          </div>

          {/* 2. DONOR/SPONSOR DETAILS */}
          <div className="pledge-section">
            <h3 className="pledge-section-title">
              2. {donorType === "private" ? "DONOR DETAILS" : "SPONSOR DETAILS"}
            </h3>

            {donorType === "private" ? (
              // Private Citizen/NGO/Corporate fields
              <>
                <div className="pledge-form-row">
                  <div className="pledge-form-group">
                    <label className="pledge-label">Full Name:</label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="pledge-input"
                      placeholder="Enter your full name"
                      aria-label="Donor full name"
                      required
                    />
                  </div>
                </div>

                <div className="pledge-form-row">
                  <div className="pledge-form-group">
                    <label className="pledge-label">
                      Organization (Optional):
                    </label>
                    <input
                      type="text"
                      value={donorOrganization}
                      onChange={(e) => setDonorOrganization(e.target.value)}
                      className="pledge-input"
                      placeholder="Your organization name (if applicable)"
                      aria-label="Donor organization name (optional)"
                    />
                  </div>
                </div>

                <div className="pledge-form-row">
                  <div className="pledge-form-group">
                    <label className="pledge-label">Address:</label>
                    <input
                      type="text"
                      value={donorAddress}
                      onChange={(e) => setDonorAddress(e.target.value)}
                      className="pledge-input"
                      placeholder="Your address"
                      aria-label="Donor address"
                      required
                    />
                  </div>
                </div>

                <div className="pledge-form-row">
                  <div className="pledge-form-group">
                    <label className="pledge-label">Email Address:</label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="pledge-input"
                      placeholder="your.email@example.com"
                      aria-label="Donor email address"
                      required
                    />
                  </div>
                </div>

                <div className="pledge-form-row">
                  <div className="pledge-form-group">
                    <label className="pledge-label">Phone Number:</label>
                    <input
                      type="tel"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="pledge-input"
                      placeholder="+94 76 123 4567"
                      aria-label="Donor phone number"
                      required
                    />
                  </div>
                </div>

                <div className="pledge-form-row">
                  <div className="pledge-form-group">
                    <label className="pledge-label">Contact Details:</label>
                    <input
                      type="text"
                      value={donorContact}
                      onChange={(e) => setDonorContact(e.target.value)}
                      className="pledge-input"
                      placeholder="Additional contact information"
                      aria-label="Donor contact details"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              // Government Sponsor fields
              <>
                <div className="pledge-form-row">
                  <div className="pledge-form-group">
                    <label className="pledge-label">
                      Government Department:
                    </label>
                    <input
                      type="text"
                      value={governmentDepartment}
                      onChange={(e) => setGovernmentDepartment(e.target.value)}
                      className="pledge-input"
                      placeholder="Department name"
                      aria-label="Government department name"
                      required
                    />
                  </div>
                </div>

                <div className="pledge-form-row">
                  <div className="pledge-form-group">
                    <label className="pledge-label">
                      Funding Sponsor/Program:
                    </label>
                    <input
                      type="text"
                      value={governmentProgram}
                      onChange={(e) => setGovernmentProgram(e.target.value)}
                      className="pledge-input"
                      placeholder="Program or scheme name"
                      aria-label="Government funding sponsor or program name"
                      required
                    />
                  </div>
                </div>

                <div className="pledge-form-row two-col">
                  <div className="pledge-form-group">
                    <label className="pledge-label">
                      Authorized Officer's Name:
                    </label>
                    <input
                      type="text"
                      value={governmentOfficerName}
                      onChange={(e) => setGovernmentOfficerName(e.target.value)}
                      className="pledge-input"
                      placeholder="Officer's full name"
                      aria-label="Authorized officer full name"
                      required
                    />
                  </div>
                  <div className="pledge-form-group">
                    <label className="pledge-label">Designation:</label>
                    <input
                      type="text"
                      value={governmentOfficerDesignation}
                      onChange={(e) =>
                        setGovernmentOfficerDesignation(e.target.value)
                      }
                      className="pledge-input"
                      placeholder="Officer's designation"
                      aria-label="Authorized officer designation"
                      required
                    />
                  </div>
                </div>

                <div className="pledge-form-row">
                  <div className="pledge-form-group">
                    <label className="pledge-label">
                      Official Contact Number:
                    </label>
                    <input
                      type="tel"
                      value={governmentOfficerContact}
                      onChange={(e) =>
                        setGovernmentOfficerContact(e.target.value)
                      }
                      className="pledge-input"
                      placeholder="+94 11 234 5678"
                      aria-label="Government officer official contact number"
                      required
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 3. PLEDGE COMMITMENT */}
          <div className="pledge-section">
            <h3 className="pledge-section-title">3. PLEDGE COMMITMENT</h3>

            <div className="pledge-form-row">
              <div className="pledge-form-group">
                <label className="pledge-label">
                  Quantity Pledging: (Max: {maxQuantity})
                </label>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="pledge-input"
                  aria-label="Quantity pledging"
                  required
                />
              </div>
            </div>

            <div className="pledge-form-row">
              <div className="pledge-form-group">
                <label className="pledge-label">Estimated Delivery Date:</label>
                <input
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="pledge-input"
                  aria-label="Estimated delivery date"
                  required
                />
              </div>
            </div>

            {message !== undefined && (
              <div className="pledge-form-row">
                <div className="pledge-form-group">
                  <label className="pledge-label">Message (Optional):</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="pledge-input pledge-textarea"
                    placeholder="Optional message for the organization"
                    aria-label="Optional message for the organization"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. DONATION CONFIRMATION LETTER */}
          <div className="pledge-section">
            <h3 className="pledge-section-title">
              4. DONATION CONFIRMATION LETTER
            </h3>

            {/* Reference Number Display */}
            <div className="pledge-form-row">
              <div className="pledge-form-group">
                <label className="pledge-label">Reference Number:</label>
                <div className="pledge-reference-display">
                  <code>{referenceNumber}</code>
                </div>
              </div>
            </div>

            {/* Letter Preview Button */}
            <div className="pledge-form-row pledge-form-row-spaced">
              <button
                type="button"
                onClick={() => {
                  setShowLetterPreview(!showLetterPreview);
                  setError("");
                }}
                className="pledge-btn pledge-btn-secondary"
                aria-label="Toggle donation letter preview"
              >
                {showLetterPreview ? "Hide" : "Show"} Letter Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!showLetterPreview) {
                    setError(
                      'Please click "Show Letter Preview" button to view the letter before downloading the PDF',
                    );
                    return;
                  }
                  if (letterRef.current) {
                    generateDonationLetterPDF(
                      letterRef.current,
                      referenceNumber,
                    );
                  }
                }}
                className="pledge-btn pledge-btn-download"
                aria-label="Download donation letter as PDF"
              >
                📥 Download Letter as PDF
              </button>
            </div>

            {error && (
              <div className="pledge-error-message pledge-error-message-spaced">
                {error}
              </div>
            )}

            {/* Letter Preview (Hidden by default) */}
            {showLetterPreview && (
              <div className="pledge-letter-preview">
                <div ref={letterRef}>
                  {section && organization ? (
                    <DonationLetterTemplate
                      donation={{
                        quantity,
                        message,
                        donorType,
                        donorName,
                        donorOrganization,
                        donorContact,
                        donorEmail,
                        donorPhone,
                        governmentDepartment,
                        governmentProgram,
                        governmentOfficerName,
                        governmentOfficerDesignation,
                        governmentOfficerContact,
                        estimatedDeliveryDate,
                        confirmApproval,
                        need: {
                          name: need.name,
                          description: need.description || "",
                          quantity_required: need.quantity_required,
                        },
                        organization: {
                          name: organization.name,
                          registration_number:
                            organization.registration_number || "",
                          address: organization.address || "",
                        },
                        section: {
                          name: section.name,
                        },
                      }}
                      referenceNumber={referenceNumber}
                    />
                  ) : (
                    <div className="pledge-loading">
                      Loading letter template...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File Upload for Signed Letter */}
            <div className="pledge-form-row">
              <div className="pledge-form-group">
                <label className="pledge-label">
                  Upload Signed Letter (PDF) *{" "}
                  <span className="pledge-required">Required</span>
                </label>
                <div className="pledge-file-upload">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== "application/pdf") {
                          setError("Please upload a PDF file only");
                          return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                          setError("File size must be less than 10MB");
                          return;
                        }
                        setLetterFile(file);
                        setError("");
                      }
                    }}
                    className="pledge-file-input"
                    aria-label="Upload signed donation letter PDF"
                  />
                  <div className="pledge-file-label">
                    {letterFile ? (
                      <div className="pledge-file-success">
                        <span className="pledge-file-icon">✓</span>
                        <div className="pledge-file-info">
                          <div className="pledge-file-name">
                            {letterFile.name}
                          </div>
                          <div className="pledge-file-size">
                            ({(letterFile.size / 1024).toFixed(2)} KB)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pledge-file-placeholder">
                        <span className="pledge-file-icon-empty">📄</span>
                        <p>Click to upload your signed letter</p>
                        <span className="pledge-file-hint">
                          PDF only, max 10MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {letterFile && (
                  <div className="pledge-file-remove-container">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLetterFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="pledge-file-remove-btn"
                      aria-label="Remove uploaded file"
                      title="Remove file"
                    >
                      ✕ Remove File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. CONFIRMATION */}
          <div className="pledge-section">
            <label className="pledge-checkbox-label">
              <input
                type="checkbox"
                checked={confirmApproval}
                onChange={(e) => setConfirmApproval(e.target.checked)}
                className="pledge-checkbox-input"
                aria-label="Confirmation of pledge commitment"
              />
              <span className="pledge-checkbox-text">
                {donorType === "private"
                  ? "I confirm that I intend to supply these items within the specified timeframe."
                  : "Official approval has been granted for this allocation."}
              </span>
            </label>
          </div>

          <div className="pledge-button-group">
            <button
              type="button"
              onClick={onClose}
              className="pledge-btn pledge-btn-cancel"
            >
              Cancel
            </button>
            <button type="submit" className="pledge-btn pledge-btn-confirm">
              Confirm Pledge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
