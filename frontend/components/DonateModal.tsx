import { useState } from "react";
import { NeedItem } from "@/lib/api";

interface DonateModalProps {
  need: NeedItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quantity: number, message?: string) => void;
}

export default function DonateModal({
  need,
  isOpen,
  onClose,
  onSubmit,
}: DonateModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const maxQuantity = need.quantity_required - need.quantity_received;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1 || quantity > maxQuantity) {
      setError(`Please enter a quantity between 1 and ${maxQuantity}`);
      return;
    }
    setError("");
    onSubmit(quantity, message);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="text-xl font-bold mb-2">Donate to: {need.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Quantity</label>
            <input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input"
              required
              placeholder={`Enter quantity (max ${maxQuantity})`}
              title="Quantity to donate"
            />
            <div className="text-xs text-gray-500 mt-1">
              Needed: {maxQuantity} {need.unit}
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input"
              rows={2}
              placeholder="Optional message for the organization"
              title="Donation message (optional)"
            />
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Donate
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #fff;
          border-radius: 8px;
          padding: 2rem;
          min-width: 320px;
          max-width: 90vw;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
        }
        .input {
          width: 100%;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 0.5rem;
        }
        .btn {
          padding: 0.5rem 1.2rem;
          border-radius: 4px;
          font-weight: 500;
        }
        .btn-primary {
          background: #2563eb;
          color: #fff;
          border: none;
        }
        .btn-secondary {
          background: #f3f4f6;
          color: #111;
          border: none;
        }
      `}</style>
    </div>
  );
}
