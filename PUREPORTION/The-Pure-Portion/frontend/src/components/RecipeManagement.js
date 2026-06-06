import React, { useState, useEffect } from "react";
import axios from "axios";
import '../styles/RecipeManagement.css';
import LoadingScreen from "./LoadingScreen";
import curry from "../styles/images/foodbyjag-jagyasini-singh.gif"
import meal from "../styles/images/meal.gif"

const RecipeManagement = () => {
  const [recipes, setRecipes] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeType, setRecipeType] = useState(""); // 'curry' or 'meal'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  
  // Curry categories
  const curryCategories = [
    "gravy",
    "meat",
    "fried",
    "dry",
    "coconut",
    "vegetable",
  ];

  // Meal categories
  const mealCategories = [
    "rice",
    "Other",
    "soup",
    "salad",
    "dessert",
    "beverage",
  ];

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    imageFile: null,
    imageUrl: "",
    servings: 1,
  });

  useEffect(() => {
    fetchRecipes();
    fetchInventoryItems();
  }, []);

  const fetchRecipes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/recipes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecipes(response.data.recipes);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      setError("Failed to fetch recipes");
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryItems(response.data.items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const handleCreateNew = (type) => {
    setRecipeType(type);
    setFormData({
      name: "",
      category: "",
      description: "",
      imageFile: null,
      imageUrl: "",
      servings: 1,
    });
    setSelectedIngredients([]);
    setShowCreateForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedIngredients.length === 0) {
      alert("Please add at least one ingredient");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Handle image upload if there's a file
      let imageUrl = "";
      if (formData.imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", formData.imageFile);

        try {
          const uploadResponse = await axios.post(
            "/api/recipes/upload-image",
            formDataUpload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );
          imageUrl = uploadResponse.data.imageUrl;
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          // Continue without image if upload fails
        }
      }

      const recipeData = {
        name: formData.name,
        description: formData.description,
        category: recipeType === "curry" ? "curry" : formData.category,
        cuisine: "sri-lankan",
        servings: formData.servings,
        prepTime: 30, // Default values
        cookTime: 30,
        ingredients: selectedIngredients,
        imageUrl: imageUrl,
        status: "active",
        subcategory: formData.category, // Store curry/meal subcategory
        totalCost,           // 👈 add this
        costPerServing,
      };

      await axios.post("/api/recipes", recipeData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert(
        `${recipeType === "curry" ? "Curry" : "Meal"} created successfully!`
      );
      resetForm();
      fetchRecipes();
    } catch (error) {
      console.error("Error creating recipe:", error);
      setError(`Failed to create ${recipeType}`);
    }
  };
  
  // Improved unit conversion function
  const convertUnits = (quantity, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return quantity;
    
    // Conversion rates to base units (kg for weight, l for volume)
    const weightConversions = {
      'g': 0.001,    // g to kg
      'kg': 1,       // kg to kg
      'lb': 0.453592, // lb to kg
      'oz': 0.0283495 // oz to kg
    };
    
    const volumeConversions = {
      'ml': 0.001,   // ml to l
      'l': 1,        // l to l
      'cup': 0.236588, // cup to l
      'tbsp': 0.0147868, // tbsp to l
      'tsp': 0.00492892  // tsp to l
    };
    
    const countConversions = {
      'pieces': 1,
      'pcs': 1,
      'dozen': 12,
      'packs': 1,
      'bottles': 1,
      'cans': 1,
      'boxes': 1
    };
    
    // Determine conversion type
    let conversions = null;
    if (weightConversions[fromUnit] && weightConversions[toUnit]) {
      conversions = weightConversions;
    } else if (volumeConversions[fromUnit] && volumeConversions[toUnit]) {
      conversions = volumeConversions;
    } else if (countConversions[fromUnit] && countConversions[toUnit]) {
      conversions = countConversions;
    }
    
    if (!conversions) {
      console.warn(`Cannot convert from ${fromUnit} to ${toUnit}`);
      return quantity; // Return original if conversion not possible
    }
    
    // Convert: fromUnit -> base -> toUnit
    const baseQuantity = quantity * conversions[fromUnit];
    return baseQuantity / conversions[toUnit];
  };

  const addIngredient = (inventoryItem, quantity, unit) => {
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    const existingIndex = selectedIngredients.findIndex(
      (ing) => ing.inventoryItemId === inventoryItem._id
    );

    if (existingIndex !== -1) {
      const updated = [...selectedIngredients];
      updated[existingIndex].quantity = parseFloat(quantity);
      updated[existingIndex].unit = unit;
      setSelectedIngredients(updated);
    } else {
      const newIngredient = {
        inventoryItemId: inventoryItem._id,
        itemName: inventoryItem.name,
        quantity: parseFloat(quantity),
        unit: unit,
        baseUnit: inventoryItem.unit, // Store inventory base unit
        costPerUnit: inventoryItem.costPerUnit
      };
      setSelectedIngredients([...selectedIngredients, newIngredient]);
    }
  };

  const removeIngredient = (index) => {
    const updated = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(updated);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      imageFile: null,
      imageUrl: "",
      servings: 1,
    });
    setSelectedIngredients([]);
    setRecipeType("");
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingRecipe(null);
    setIngredientSearch("");
  };

  // Handle edit recipe
  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setRecipeType(recipe.category === "curry" ? "curry" : "meal");
    setFormData({
      name: recipe.name,
      category: recipe.subcategory || recipe.category,
      description: recipe.description || "",
      imageFile: null,
      imageUrl: recipe.imageUrl || "",
      servings: recipe.servings || 1,
    });
    setSelectedIngredients(recipe.ingredients || []);
    setShowEditForm(true);
  };

  // Handle update recipe
  const handleUpdateRecipe = async (e) => {
    e.preventDefault();

    if (selectedIngredients.length === 0) {
      alert("Please add at least one ingredient");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Handle image upload if there's a new file
      let imageUrl = formData.imageUrl;
      if (formData.imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", formData.imageFile);

        try {
          const uploadResponse = await axios.post(
            "/api/recipes/upload-image",
            formDataUpload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );
          imageUrl = uploadResponse.data.imageUrl;
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
        }
      }

      const recipeData = {
        name: formData.name,
        description: formData.description,
        category: recipeType === "curry" ? "curry" : formData.category,
        cuisine: "sri-lankan",
        servings: formData.servings,
        prepTime: 30,
        cookTime: 30,
        ingredients: selectedIngredients,
        imageUrl: imageUrl,
        status: "active",
        subcategory: formData.category,
        totalCost,       // ✅ now safe
        costPerServing,  // ✅ now safe
      };

      await axios.put(
        `/api/recipes/${editingRecipe._id}`,
        recipeData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(
        `${recipeType === "curry" ? "Curry" : "Meal"} updated successfully!`
      );
      resetForm();
      fetchRecipes();
    } catch (error) {
      console.error("Error updating recipe:", error);
      setError(`Failed to update ${recipeType}`);
    }
  };

  // Handle delete recipe
  const handleDeleteRecipe = async (recipeId, recipeName) => {
    if (!window.confirm(`Are you sure you want to delete "${recipeName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/recipes/${recipeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Recipe deleted successfully!");
      fetchRecipes();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      setError("Failed to delete recipe");
    }
  };

  // Only show filtered items if there's a search query
  const filteredInventoryItems = ingredientSearch.trim()
    ? inventoryItems.filter((item) =>
        item.name.toLowerCase().includes(ingredientSearch.toLowerCase())
      )
    : [];

  // Calculate total cost with proper unit conversion
  const calculateTotalCost = () => {
    return selectedIngredients.reduce((total, ingredient) => {
      // Convert quantity to base unit for cost calculation
      const baseQuantity = convertUnits(
        ingredient.quantity,
        ingredient.unit,
        ingredient.baseUnit
      );
      return total + baseQuantity * ingredient.costPerUnit;
    }, 0);
  };
  const totalCost = calculateTotalCost();
  const costPerServing = totalCost / formData.servings;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  // Generate PDF for recipe - Call backend API
  const generateRecipePDF = async (recipe) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/recipes/${recipe._id}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${recipe.name.replace(/[^a-z0-9]/gi, '_')}_Recipe.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Get available units for an ingredient
  const getAvailableUnits = (item) => {
    const baseUnit = item.unit;
    const unitGroups = {
      // Weight units
      kg: ["kg", "g", "lb", "oz"],
      g: ["g", "kg", "oz", "lb"],
      lb: ["lb", "kg", "g", "oz"],
      oz: ["oz", "lb", "g", "kg"],

      // Volume units
      l: ["l", "ml", "cup", "tbsp", "tsp"],
      ml: ["ml", "l", "cup", "tbsp", "tsp"],
      cup: ["cup", "ml", "l", "tbsp", "tsp"],
      tbsp: ["tbsp", "tsp", "cup", "ml"],
      tsp: ["tsp", "tbsp", "cup", "ml"],

      // Count units
      pieces: ["pieces", "pcs", "dozen"],
      pcs: ["pcs", "pieces", "dozen"],
      dozen: ["dozen", "pcs", "pieces"],
      packs: ["packs", "pieces"],
      bottles: ["bottles", "pieces"],
      cans: ["cans", "pieces"],
      boxes: ["boxes", "pieces"],
    };

    return unitGroups[baseUnit] || [baseUnit];
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="recipe-management">
      <div className="recipe-header">
        <h2>Recipe Management</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!showCreateForm && !showEditForm ? (
        <>
          <div className="recipe-dashboard">
            <div className="create-options">
              <div
                className="create-card"
                onClick={() => handleCreateNew("curry")}
              >
                <div className="create-icon">
                  <img src={curry} className="curryicon"></img>
                </div>
                <h3>Create Curry</h3>
                <p>Create a new Sri Lankan curry recipe</p>
              </div>

              <div
                className="create-card"
                onClick={() => handleCreateNew("meal")}
              >
                <div className="create-icon">
                  <img src={meal} className="curryicon"></img>
                </div>
                <h3>New Meal</h3>
                <p>Create a new meal recipe</p>
              </div>
            </div>
          </div>

          {recipes.length > 0 && (
            <div className="existing-recipes">
              <h3>Your Recipes</h3>
              <div className="recipes-grid">
                {recipes.map((recipe) => (
                  <div key={recipe._id} className="recipe-card">
                    {recipe.imageUrl && (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="recipe-image"
                      />
                    )}
                    <div className="recipe-content">
                      <h4>{recipe.name}</h4>
                      <p className="recipe-category">
                        {recipe.category === "curry"
                          ? `${recipe.subcategory} curry`
                          : recipe.subcategory}
                      </p>
                      
                      <div className="recipe-meta">
                        <span>💰 {formatCurrency(recipe.costPerServing)}</span>
                        <span>👥 {recipe.servings} servings</span>
                      </div>
                      <div className="recipe-ingredients-count">
                        🥘 {recipe.ingredients.length} ingredients
                      </div>
                      <div className="recipe-actions">
                        <button
                          className="btn-pdf"
                          onClick={() => generateRecipePDF(recipe)}
                          title="Download PDF"
                        >
                          📄 PDF
                        </button>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditRecipe(recipe)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() =>
                            handleDeleteRecipe(recipe._id, recipe.name)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <RecipeForm
          isEdit={showEditForm}
          recipeType={recipeType}
          formData={formData}
          setFormData={setFormData}
          selectedIngredients={selectedIngredients}
          setSelectedIngredients={setSelectedIngredients}
          ingredientSearch={ingredientSearch}
          setIngredientSearch={setIngredientSearch}
          inventoryItems={inventoryItems}
          onSubmit={showEditForm ? handleUpdateRecipe : handleSubmit}
          onCancel={resetForm}
          curryCategories={curryCategories}
          mealCategories={mealCategories}
          addIngredient={addIngredient}
          removeIngredient={removeIngredient}
          calculateTotalCost={calculateTotalCost}
          formatCurrency={formatCurrency}
          getAvailableUnits={getAvailableUnits}
          convertUnits={convertUnits}
        />
      )}
    </div>
  );
};

// Recipe Form Component
const RecipeForm = ({
  isEdit,
  recipeType,
  formData,
  setFormData,
  selectedIngredients,
  ingredientSearch,
  setIngredientSearch,
  inventoryItems,
  onSubmit,
  onCancel,
  curryCategories,
  mealCategories,
  addIngredient,
  removeIngredient,
  calculateTotalCost,
  formatCurrency,
  getAvailableUnits,
  convertUnits
}) => {
  const filteredInventoryItems = ingredientSearch.trim()
    ? inventoryItems.filter((item) =>
        item.name.toLowerCase().includes(ingredientSearch.toLowerCase())
      )
    : [];

  return (
    <div className="create-form">
      <div className="form-header">
        <h3>{isEdit ? 'Edit' : 'Create'} {recipeType === "curry" ? "Curry" : "New Meal"}</h3>
        <button className="close-btn" onClick={onCancel}>×</button>
      </div>

      <form onSubmit={onSubmit} className="recipe-form">
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>{recipeType === "curry" ? "Curry Name" : "Meal Name"} *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder={recipeType === "curry" ? "e.g., Daal Curry" : "e.g., Fried Rice"}
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {(recipeType === "curry" ? curryCategories : mealCategories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Servings *</label>
              <input
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                required
                min="1"
                max="50"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              placeholder="Describe your recipe..."
            />
          </div>

          <div className="form-group">
            <label>Upload Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setFormData({ ...formData, imageFile: file });
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setFormData((prev) => ({ ...prev, imageUrl: e.target.result }));
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="file-input"
            />
            {formData.imageUrl && (
              <div className="image-preview">
                <img src={formData.imageUrl} alt="Preview" />
              </div>
            )}
          </div>
        </div>

        <div className="ingredients-section">
          <h4>Select Ingredients (for {formData.servings} serving{formData.servings > 1 ? 's' : ''})</h4>

          <div className="ingredient-search">
            <input
              type="text"
              placeholder="Search ingredients from inventory..."
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="inventory-items">
            {ingredientSearch.trim() === "" ? (
              <div className="search-prompt">
                <p>Start typing to search for ingredients...</p>
              </div>
            ) : filteredInventoryItems.length === 0 ? (
              <div className="no-results">
                <p>No ingredients found for "{ingredientSearch}"</p>
              </div>
            ) : (
              filteredInventoryItems.map((item) => (
                <IngredientSelector
                  key={item._id}
                  item={item}
                  onAdd={addIngredient}
                  isSelected={selectedIngredients.some((ing) => ing.inventoryItemId === item._id)}
                  availableUnits={getAvailableUnits(item)}
                />
              ))
            )}
          </div>

          {selectedIngredients.length > 0 && (
            <div className="selected-ingredients">
              <h5>Selected Ingredients:</h5>
              {selectedIngredients.map((ingredient, index) => (
                <div key={index} className="selected-ingredient">
                  <span className="ingredient-name">{ingredient.itemName}</span>
                  <span className="ingredient-quantity">{ingredient.quantity} {ingredient.unit}</span>
                  <span className="ingredient-cost">
                    {formatCurrency(
                      convertUnits(ingredient.quantity, ingredient.unit, ingredient.baseUnit) * ingredient.costPerUnit
                    )}
                  </span>
                  <button type="button" onClick={() => removeIngredient(index)} className="remove-btn">
                    Remove
                  </button>
                </div>
              ))}
              <div className="total-cost">
                <strong>Total Cost: {formatCurrency(calculateTotalCost())}</strong>
                <div className="cost-per-serving">
                  Cost per serving: {formatCurrency(calculateTotalCost() / formData.servings)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">
            {isEdit ? 'Update' : 'Create'} {recipeType === "curry" ? "Curry" : "Meal"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Ingredient Selector Component
const IngredientSelector = ({ item, onAdd, isSelected, availableUnits }) => {
  const [quantity, setQuantity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(item.unit);

  const handleAdd = () => {
    if (quantity && parseFloat(quantity) > 0) {
      onAdd(item, quantity, selectedUnit);
      setQuantity("");
    }
  };

  return (
    <div className={`ingredient-selector ${isSelected ? "selected" : ""}`}>
      <div className="ingredient-info">
        <span className="ingredient-name">{item.name}</span>
        <span className="ingredient-available">Available: {item.currentQuantity} {item.unit}</span>
        <span className="ingredient-cost">LKR {item.costPerUnit}/{item.costUnit}</span>
      </div>

      <div className="ingredient-controls">
        <input
          type="number"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0.01"
          step="0.01"
          className="quantity-input"
        />

        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="unit-select"
        >
          {availableUnits.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleAdd}
          className="add-ingredient-btn"
          disabled={!quantity || parseFloat(quantity) <= 0}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default RecipeManagement;