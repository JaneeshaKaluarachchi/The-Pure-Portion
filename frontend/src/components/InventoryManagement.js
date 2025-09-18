import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../styles/InventoryManagement.css";
import LoadingScreen from "./LoadingScreen";
import StockModal from "../components/StockModal";
import ConfirmModal from "../components/ConfirmModal";


const InventoryManagement = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    search: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
const [stockModal, setStockModal] = useState({
  show: false,
  id: null,
  operation: "",
});
  const categories = [
    "vegetables",
    "fruits",
    "meat",
    "seafood",
    "dairy",
    "grains",
    "spices",
    "beverages",
    "condiments",
    "frozen",
    "canned",
    "other",
  ];

  const units = [
    "kg",
    "g",
    "l",
    "ml",
    "pieces",
    "packs",
    "bottles",
    "cans",
    "boxes",
  ];
  const locations = [
    "refrigerator",
    "freezer",
    "pantry",
    "storage-room",
    "dry-storage",
  ];
const costUnitLabels = {
  kg: "per 1 kg",
  g: "per 100 g",
  l: "per 1 l",
  ml: "per 100 ml",
  pieces: "per piece",
  packs: "per pack",
  bottles: "per bottle",
  cans: "per can",
  boxes: "per box",
};

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    unit: "",
    currentQuantity: "",
    minQuantity: "",
    maxQuantity: "",
    costPerUnit: "",
    costUnit: "kg",
    location: "storage-room",
    expiryDate: "",
    purchaseDate: "",
    batchNumber: "",
    notes: "",
    supplier: { name: "", contact: "", email: "" },
  });
  // ✅ Determine item status dynamically
  const getItemStatus = (item) => {
    const now = new Date();

    if (item.expiryDate && new Date(item.expiryDate) < now) {
      return "expired";
    } else if (item.currentQuantity === 0) {
      return "out-of-stock";
    } else if (item.currentQuantity <= item.minQuantity) {
      return "low-stock";
    } else {
      return "in-stock";
    }
  };

  const fetchItems = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filters.category !== "all")
        params.append("category", filters.category);
      if (filters.search) params.append("search", filters.search);

      // ⚠️ Don't send status to backend, we handle it client-side
      const response = await axios.get(
        `http://localhost:5000/api/inventory?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let fetchedItems = response.data.items;

      // ✅ Apply status filter manually
      if (filters.status !== "all") {
        fetchedItems = fetchedItems.filter(
          (item) => getItemStatus(item) === filters.status
        );
      }

      setItems(fetchedItems); // ✅ correct
      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError("Failed to fetch inventory items");
      setLoading(false);
    }
  }, [filters]);

  // ✅ fetchStats wrapped in useCallback
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/inventory/stats",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // ✅ useEffect with correct dependencies
  useEffect(() => {
    fetchItems();
    fetchStats();
  }, [fetchItems, fetchStats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (editingItem) {
        await axios.put(
          `http://localhost:5000/api/inventory/${editingItem._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setError("");
        alert("Inventory item updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/inventory", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setError("");
        alert("Inventory item added successfully!");
      }

      resetForm();
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      setError("Failed to save inventory item");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ...item,
      expiryDate: item.expiryDate
        ? new Date(item.expiryDate).toISOString().split("T")[0]
        : "",
      purchaseDate: item.purchaseDate
        ? new Date(item.purchaseDate).toISOString().split("T")[0]
        : "",
      supplier: item.supplier || { name: "", contact: "", email: "" },
    });
    setShowAddForm(true);
  };

  const handleDeleteClick = (id) => {
    setConfirmDelete({ show: true, id });
  };

  const confirmDeleteItem = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/inventory/${confirmDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchItems();
      fetchStats();
      alert("Inventory item deleted successfully!");
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Failed to delete inventory item");
    }
    setConfirmDelete({ show: false, id: null });
  };

  const handleStockUpdateClick = (id, operation) => {
    setStockModal({ show: true, id, operation });
  };

  const confirmStockUpdate = async (quantity) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/inventory/${stockModal.id}/stock`,
        {
          quantity,
          operation: stockModal.operation,
          reason: `Manual ${stockModal.operation} operation`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchItems();
      fetchStats();
      alert(`Stock ${stockModal.operation}ed successfully!`);
    } catch (error) {
      console.error("Error updating stock:", error);
      setError("Failed to update stock");
    }
    setStockModal({ show: false, id: null, operation: "" });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      subcategory: "",
      unit: "",
      currentQuantity: "",
      minQuantity: "",
      maxQuantity: "",
      costPerUnit: "",
      location: "storage-room",
      expiryDate: "",
      purchaseDate: "",
      batchNumber: "",
      notes: "",
      supplier: { name: "", contact: "", email: "" },
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "in-stock":
        return "badge-in-stock";
      case "low-stock":
        return "badge-low-stock";
      case "out-of-stock":
        return "badge-out-stock";
      case "expired":
        return "badge-expired";
      default:
        return "badge-default";
    }
  };

  const normalizeQuantity = (quantity, unit) => {
    const q = Number(quantity) || 0;
    switch (unit) {
      case "kg": return q * 1000;  // convert kg → g
    case "g": return q;          // already in g
    case "l": return q * 1000;   // convert l → ml
    case "ml": return q; 
      case "pieces":
      case "packs":
      case "bottles":
      case "cans":
      case "boxes":
        return q;
      default:
        return q;
    }
  };
  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/inventory/report/pdf",
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // important for files
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "inventory_report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    }
  };

  const normalizeCost = (value, unit) => {
  switch (unit) {
    case "kg": return value / 1000;  // cost per g
    case "g": return value / 100;    // cost per g (if given per 100g)
    case "l": return value / 1000;   // cost per ml
    case "ml": return value / 100;   // cost per ml (if given per 100ml)
    default: return value;           // per piece, per pack, etc.
  }
};


const calculateItemValue = (item) => {
  const normalizedQty = normalizeQuantity(item.currentQuantity, item.unit);   // in base unit
  const costBase = normalizeCost(item.costPerUnit, item.costUnit);            // cost per base unit
  return normalizedQty * costBase;
};



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="inventory-management">
      <div className="inventory-header">
        <h2>Inventory Management</h2>
        <button className="btn-primary1" onClick={() => setShowAddForm(true)}>
          + Add Item
        </button>
        <button className="btn-pdf" onClick={handleDownloadPDF}>
          📄 Download PDF
        </button>
      </div>

      <ConfirmModal
        show={confirmDelete.show}
        title="Delete Item"
        message="Are you sure you want to delete this inventory item?"
        onConfirm={confirmDeleteItem}
        onCancel={() => setConfirmDelete({ show: false, id: null })}
      />

      <StockModal
        show={stockModal.show}
        operation={stockModal.operation}
        onConfirm={confirmStockUpdate}
        onCancel={() => setStockModal({ show: false, id: null, operation: "" })}
      />

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Dashboard */}
      <div className="inventory-stats">
        <div className="stat-card">
          <h3>Total Items</h3>
          <p className="stat-number">{stats.totalItems || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Value</h3>
          <p className="stat-number">{formatCurrency(stats.totalValue || 0)}</p>
        </div>
        <div className="stat-card alert-card">
          <h3>Low Stock Alerts</h3>
          <p className="stat-number">{stats.alerts?.lowStock || 0}</p>
        </div>
        <div className="stat-card alert-card">
          <h3>Expiring Soon</h3>
          <p className="stat-number">{stats.alerts?.expiringSoon || 0}</p>
        </div>
      </div>


      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? "Edit Item" : "Add New Item"}</h3>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="inventory-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Unit</option>
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc.charAt(0).toUpperCase() +
                          loc.slice(1).replace("-", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Current Quantity *</label>
                  <input
                    type="number"
                    value={formData.currentQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentQuantity: e.target.value,
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Min Quantity *</label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, minQuantity: e.target.value })
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
               <div className="form-group">
  <label>
    Cost {costUnitLabels[formData.costUnit] || ""}
  </label>
  <input
    type="number"
    value={formData.costPerUnit}
    onChange={(e) =>
      setFormData({ ...formData, costPerUnit: e.target.value })
    }
    required
    min="0"
    step="0.01"
  />
  <select
    value={formData.costUnit}
    onChange={(e) =>
      setFormData({ ...formData, costUnit: e.target.value })
    }
    required
  >
    {units.map((unit) => (
      <option key={unit} value={unit}>
        {unit}
      </option>
    ))}
  </select>
</div>


              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Supplier Name</label>
                <input
                  type="text"
                  value={formData.supplier.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplier: { ...formData.supplier, name: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary2">
                  {editingItem ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Alerts Section */}
      {(stats.lowStockItems?.length > 0 || stats.expiringItems?.length > 0) && (
        <div className="alerts-section">
          {stats.lowStockItems?.length > 0 && (
            <div className="alert-panel low-stock-alert">
              <h3>⚠️ Low Stock Items</h3>
              <ul>
                {stats.lowStockItems.map((item) => (
                  <li key={item._id}>
                    <strong>{item.name}</strong> ({item.itemId}) - Current:{" "}
                    {item.currentQuantity}, Min: {item.minQuantity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.expiringItems?.length > 0 && (
            <div className="alert-panel expiring-alert">
              <h3>⏰ Items Expiring Soon</h3>
              <ul>
                {stats.expiringItems.map((item) => (
                  <li key={item._id}>
                    <strong>{item.name}</strong> ({item.itemId}) - Expires:{" "}
                    {new Date(item.expiryDate).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="inventory-filters">
        <h1>Inventory Table</h1>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
          <option value="expired">Expired</option>
        </select>

        <input
          type="text"
          placeholder="Search items..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Inventory Items Table */}
      <div className="inventory-table">
        <table>
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Current Qty</th>
              <th>Min Qty</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Value</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.itemId}</td>
                <td>{item.name}</td>
                <td className="category-cell">
                  {item.category.charAt(0).toUpperCase() +
                    item.category.slice(1)}
                </td>
                <td className="quantity-cell">
                  <span
                    className={
                      item.currentQuantity <= item.minQuantity
                        ? "low-quantity"
                        : ""
                    }
                  >
                    {item.currentQuantity}
                  </span>
                </td>
                <td>{item.minQuantity}</td>
                <td>{item.unit}</td>
                <td>
                  <span
                    className={`status-badge ${getStatusBadge(
                      getItemStatus(item)
                    )}`}
                  >
                    {getItemStatus(item).replace("-", " ")}
                  </span>
                </td>

                <td>{formatCurrency(calculateItemValue(item))}</td>
                <td>
                  {item.expiryDate
                    ? new Date(item.expiryDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn-edit"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleStockUpdateClick(item._id, "add")}
                      className="btn-stock-in"
                      title="Stock In"
                    >
                      ➕
                    </button>
                    <button
                      onClick={() =>
                        handleStockUpdateClick(item._id, "subtract")
                      }
                      className="btn-stock-out"
                      title="Stock Out"
                    >
                      ➖
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item._id)}
                      className="btn-delete"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="no-items">
            <p>No inventory items found. Add your first item to get started!</p>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default InventoryManagement;
