// StockModal.jsx
import React, { useState } from "react";
import "../styles/ConfirmModal.css";

const StockModal = ({ show, operation, onConfirm, onCancel }) => {
  const [quantity, setQuantity] = useState("");

  if (!show) return null;

  const handleConfirm = () => {
    if (!quantity || isNaN(quantity)) {
      alert("Please enter a valid number!");
      return;
    }
    onConfirm(Number(quantity));
    setQuantity("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{operation === "add" ? "Stock In" : "Stock Out"}</h3>
        <input
          type="number"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"
          step="0.01"
        />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockModal;
