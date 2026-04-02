import { NeedItem, priorityLabels, unitLabels } from "@/lib/api";
import "./NeedCard.css";
import "../app/donor-modal-custom.css";

interface NeedCardProps {
  need: NeedItem;
  showSection?: boolean;
  sectionName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onDonate?: (need: NeedItem) => void;
  showDonateButton?: boolean;
}

export default function NeedCard({
  need,
  showSection,
  sectionName,
  onEdit,
  onDelete,
  onDonate,
  showDonateButton,
}: NeedCardProps) {
  const progress =
    need.quantity_required > 0
      ? Math.min((need.quantity_received / need.quantity_required) * 100, 100)
      : 0;

  const remaining = need.quantity_required - need.quantity_received;

  return (
    <div className="need-card">
      <div className="need-card__header">
        <div className="need-card__title-wrap">
          <h3 className="need-card__title">{need.name}</h3>
          {showSection && sectionName && (
            <p className="need-card__section">{sectionName}</p>
          )}
        </div>
        <span
          className={`need-card__priority need-card__priority--${String(
            need.priority,
          ).toLowerCase()}`}
        >
          {priorityLabels[need.priority]}
        </span>
      </div>

      {need.description && (
        <p className="need-card__description">{need.description}</p>
      )}

      {/* Progress Bar */}
      <div className="need-card__progress-block">
        <div className="need-card__progress-header">
          <span className="need-card__muted">Progress</span>
          <span className="need-card__strong">{progress.toFixed(0)}%</span>
        </div>
        <progress
          className={`need-progress ${
            progress >= 100
              ? "need-progress--complete"
              : progress >= 50
                ? "need-progress--good"
                : progress >= 25
                  ? "need-progress--medium"
                  : "need-progress--low"
          }`}
          value={progress}
          max={100}
          aria-label={`Progress for ${need.name}`}
        />
      </div>

      {/* Quantities */}
      <div className="need-card__quantities">
        <div>
          <span className="need-card__muted">Received: </span>
          <span className="need-card__received">
            {need.quantity_received} {unitLabels[need.unit]}
          </span>
        </div>
        <div>
          <span className="need-card__muted">Needed: </span>
          <span
            className={`need-card__needed ${
              remaining > 0
                ? "need-card__needed--remaining"
                : "need-card__needed--complete"
            }`}
          >
            {remaining > 0 ? remaining : 0} {unitLabels[need.unit]}
          </span>
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onDelete || (showDonateButton && onDonate)) && (
        <div className="need-card__actions">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Edit need"
              className="need-card__action-btn need-card__action-btn--edit"
            >
              <svg
                className="w-3.5 h-3.5"
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
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete need"
              className="need-card__action-btn need-card__action-btn--delete"
            >
              <svg
                className="w-3.5 h-3.5"
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
              Delete
            </button>
          )}
          {showDonateButton && onDonate && (
            <button
              onClick={() => onDonate(need)}
              title="Donate to this need"
              className="donate-btn-custom"
            >
              <svg
                className="w-4 h-4 mr-1 -mt-0.5"
                fill="none"
                stroke="#2563eb"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 13c-4.418 0-8-3.582-8-8 0-3.314 2.686-6 6-6 1.306 0 2.417.835 2.83 2H12c-2.21 0-4 1.79-4 4 0 2.21 1.79 4 4 4s4-1.79 4-4c0-.553-.112-1.078-.312-1.563C16.417 9.835 17.528 9 18.834 9c3.314 0 6 2.686 6 6 0 4.418-3.582 8-8 8z"
                />
              </svg>
              <span style={{ color: "#2563eb", fontWeight: 600 }}>Donate</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
