import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from "./LoadingScreen";
import NotificationCenter from "./NotificationCenter";
import "../styles/PortionCalculator.css";

const PortionCalculator = () => {
  const { currentUser } = useAuth(); // Get user from AuthContext
  const [recipes, setRecipes] = useState([]);
  const [selectedMainMeal, setSelectedMainMeal] = useState(null);
  const [selectedCurries, setSelectedCurries] = useState([]);
  const [peopleCount, setPeopleCount] = useState(1);
  const [planName, setPlanName] = useState("");
  const [userRole, setUserRole] = useState(null); // Auto-detected user role
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);

  // Plate portions state - only 5 curry spots + 1 main
  const [portions, setPortions] = useState({
    center: null,
    curry1: null,
    curry2: null,
    curry3: null,
    curry4: null,
    curry5: null,
  });

  const [draggedItem, setDraggedItem] = useState(null);

  // Separate recipes by category
  const mealRecipes = recipes.filter((recipe) => recipe.category !== "curry");

  const curryRecipes = recipes.filter((recipe) => recipe.category === "curry");

  // Group curries by subcategory
  const groupedCurries = curryRecipes.reduce((groups, curry) => {
    const category = curry.subcategory || "Other";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(curry);
    return groups;
  }, {});

  // Filter meals based on search term
  const filteredMeals = mealRecipes.filter((meal) =>
    meal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (meal.category || "Other").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (meal.subcategory || "Other").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter curries based on search term
  const filteredCurries = Object.keys(groupedCurries).reduce(
  (filtered, category) => {
    const filteredRecipes = groupedCurries[category].filter(
      (curry) =>
        curry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (curry.subcategory || "Other")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    if (filteredRecipes.length > 0) {
      filtered[category] = filteredRecipes;
    }
    return filtered;
  },
  {}
);

  useEffect(() => {
    // Auto-detect user role from AuthContext
    if (currentUser && currentUser.role) {
      setUserRole(currentUser.role);
      console.log("Auto-detected user role from AuthContext:", currentUser.role);
    }
    fetchRecipes();
  }, [currentUser]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/recipes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecipes(response.data.recipes || []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      setError("Failed to fetch recipes");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, recipe, type, portionKey = null) => {
    setDraggedItem({ recipe, type, portionKey });
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ recipe, type, portionKey })
    );
    e.target.classList.add("dragging");
  };
  
  const handlePlacedFoodDragEnd = (e, portionKey) => {
    const plate = document.querySelector(".plate");
    const plateRect = plate.getBoundingClientRect();
    const { clientX, clientY } = e;

    // Check if dropped outside plate
    if (
      clientX < plateRect.left ||
      clientX > plateRect.right ||
      clientY < plateRect.top ||
      clientY > plateRect.bottom
    ) {
      removeFoodFromPlate(portionKey);
    }

    e.target.classList.remove("dragging");
    setDraggedItem(null);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove("dragging");
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.target.closest(".portion-area")?.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.target.closest(".portion-area")?.classList.remove("drag-over");
  };

  const handlePlateDrop = (e, portionKey) => {
    e.preventDefault();
    e.target.closest(".portion-area")?.classList.remove("drag-over");

    if (draggedItem) {
      const { recipe, type } = draggedItem;

      // Check if it's a main meal and center position
      if (type === "meal" && portionKey === "center") {
        setPortions((prev) => ({
          ...prev,
          [portionKey]: recipe,
        }));
        setSelectedMainMeal(recipe);
      }
      // Check if it's a curry and not center position
      else if (
        type === "curry" &&
        portionKey !== "center" &&
        selectedCurries.length < 5
      ) {
        if (!selectedCurries.find((curry) => curry._id === recipe._id)) {
          setPortions((prev) => ({
            ...prev,
            [portionKey]: recipe,
          }));
          setSelectedCurries((prev) => [...prev, recipe]);
        }
      }
    }
  };

  const removeFoodFromPlate = (portionKey) => {
    const removedItem = portions[portionKey];

    setPortions((prev) => ({
      ...prev,
      [portionKey]: null,
    }));

    if (portionKey === "center") {
      setSelectedMainMeal(null);
    } else {
      setSelectedCurries((prev) =>
        prev.filter((curry) => curry._id !== removedItem._id)
      );
    }
  };

  const generatePortionPlan = async () => {
    if (!selectedMainMeal || selectedCurries.length === 0 || !planName) {
      alert(
        "Please select a main meal, at least one curry, and enter a plan name"
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const planData = {
        name: planName,
        mainMeal: {
          recipeId: selectedMainMeal._id,
        },
        curries: selectedCurries.map((curry) => ({
          recipeId: curry._id,
        })),
        peopleCount: parseInt(peopleCount),
        userType: userRole, // Use auto-detected role from AuthContext
      };

      const response = await axios.post(
        "http://localhost:5000/api/portions",
        planData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGeneratedPlan(response.data.portionPlan);
      setShowResults(true);
      
      // Show appropriate message based on inventory availability
      if (response.data.hasInsufficientInventory) {
        setError(
          `Portion plan created but cannot be executed due to insufficient inventory. ${response.data.missingItems.length} items need restocking. Check notifications for details.`
        );
      } else {
        setError(""); // Clear any previous errors
      }
    } catch (error) {
      console.error("Error generating portion plan:", error);
      setError(
        "Failed to generate portion plan: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const executePortionPlan = async () => {
    if (!generatedPlan) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/portions/${generatedPlan._id}/execute`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(
        userRole === "restaurant"
          ? "Portion plan executed! Inventory has been deducted."
          : "Grocery list generated successfully!"
      );
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Error executing portion plan:", error);
      
      if (error.response?.data?.unavailableItems) {
        setError(
          `Cannot execute portion plan. Insufficient inventory for ${error.response.data.unavailableItems.length} items. Please check inventory notifications.`
        );
      } else {
        setError(
          "Failed to execute portion plan: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const downloadPDF = async () => {
    if (!generatedPlan) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/portions/${generatedPlan._id}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${userRole === "restaurant" ? "portion-plan" : "grocery-list"}-${generatedPlan.planId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    }
  };

  const resetCalculator = () => {
    setSelectedMainMeal(null);
    setSelectedCurries([]);
    setPeopleCount(1);
    setPlanName("");
    setGeneratedPlan(null);
    setShowResults(false);
    setError("");
    setSearchTerm("");
    setPortions({
      center: null,
      curry1: null,
      curry2: null,
      curry3: null,
      curry4: null,
      curry5: null,
    });
  };

  // Go back to portion selection from results
  const goBackToPortionSelection = () => {
    setShowResults(false);
    setGeneratedPlan(null);
    setError("");
  };

  const handleNotificationUpdate = useCallback((count) => {
    setNotificationCount(count);
  }, []);

  const renderPortionArea = (portionKey, className, size = "small") => (
    <div
      className={`portion-area ${className} ${size}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handlePlateDrop(e, portionKey)}
    >
      {portions[portionKey] ? (
        <div
          className="placed-food"
          draggable
          onDragStart={(e) =>
            handleDragStart(
              e,
              portions[portionKey],
              portionKey === "center" ? "meal" : "curry",
              portionKey
            )
          }
          onDragEnd={(e) => handlePlacedFoodDragEnd(e, portionKey)}
        >
          <img
            src={portions[portionKey].imageUrl}
            alt={portions[portionKey].name}
          />
        </div>
      ) : (
        <div className="add-icon">+</div>
      )}
    </div>
  );

 if (loading) return <LoadingScreen />;

  return (
    <div className="portion-calculator">
      <div className="calculator-header">
        <div className="header-content">
          {showResults && (
            <button className="back-arrow" onClick={goBackToPortionSelection} title="Go back to portion selection">
              ←
            </button>
          )}
          <h2>Portion Calculator 🍽️</h2>
        </div>
        <div className="header-actions">
          <NotificationCenter 
            module="portion_calculator" 
            onNotificationUpdate={handleNotificationUpdate}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!showResults ? (
        <div className="calculator-content">
          {/* Left Side - Plate Design */}
          <div className="plate-container">
            <div className="plate">
              {renderPortionArea("center", "center", "center")}
              {renderPortionArea("curry1", "small curry1", "small")}
              {renderPortionArea("curry2", "small curry2", "small")}
              {renderPortionArea("curry3", "small curry3", "small")}
              {renderPortionArea("curry4", "small curry4", "small")}
              {renderPortionArea("curry5", "small curry5", "small")}
            </div>
          </div>

          {/* Right Side - Recipe Selection */}
          <div className="recipe-selection">
            {/* Search Bar */}
            <div className="search-container">
              <input
                type="text"
                className="search-bar"
                placeholder="🔍 Search curries and meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
           
{/* Main Meals Section */}
<div className="recipe-section">
  <h3>Main Meals 🍽️</h3>
  <div className="categories">
    {Object.entries(
      filteredMeals.reduce((groups, meal) => {
        const category = meal.category || "Other";
        if (!groups[category]) groups[category] = [];
        groups[category].push(meal);
        return groups;
      }, {})
    )
      // Sort categories: Rice first, then alphabetically
      .sort(([catA], [catB]) => {
        if (catA.toLowerCase() === "rice") return -1;
        if (catB.toLowerCase() === "rice") return 1;
        return catA.localeCompare(catB);
      })
      .map(([category, meals]) => (
        <div key={category} className="meal-category">
          <h4 className="category-title">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </h4>
          <div className="category-scroll">
            {meals.map((recipe) => (
              <div
                key={recipe._id}
                className="recipe-item"
                draggable
                onDragStart={(e) => handleDragStart(e, recipe, "meal")}
                onDragEnd={handleDragEnd}
              >
                {recipe.imageUrl && (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.name}
                    className="recipe-thumb"
                  />
                )}
                <div className="recipe-info">
                  <h4>{recipe.name}</h4>
                  <span>
                    Rs{recipe.costPerServing?.toFixed(2) || "0.00"}/serving
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
  </div>
</div>

{/* Curries Section */}
<div className="recipe-section">
  <h3>Curries 🍛 (Max 5)</h3>
  <div className="categories">
    {Object.entries(filteredCurries)
      // Sort categories: Rice first, then alphabetically
      .sort(([catA], [catB]) => {
        if (catA.toLowerCase() === "rice") return -1;
        if (catB.toLowerCase() === "rice") return 1;
        return catA.localeCompare(catB);
      })
      .map(([category, curries]) => (
        <div key={category} className="curry-category">
          <h4 className="category-title">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </h4>
          <div className="category-scroll">
            {curries.map((recipe) => (
              <div
                key={recipe._id}
                className="recipe-item"
                draggable
                onDragStart={(e) => handleDragStart(e, recipe, "curry")}
                onDragEnd={handleDragEnd}
              >
                {recipe.imageUrl && (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.name}
                    className="recipe-thumb"
                  />
                )}
                <div className="recipe-info">
                  <h4>{recipe.name}</h4>
                  <p>{recipe.subcategory} curry</p>
                  <span>
                    Rs{recipe.costPerServing?.toFixed(2) || "0.00"}/serving
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
  </div>
</div>

            {/* Plan Details */}
            <div className="plan-details">
              <div className="form-group">
                <label>Plan Name:</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Enter plan name"
                />
              </div>
              <div className="form-group">
                <label>Number of People:</label>
                <input
                  type="number"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="action-buttons">
              <button
                className="generate-btn"
                onClick={generatePortionPlan}
                disabled={
                  !selectedMainMeal || selectedCurries.length === 0 || !planName
                }
              >
                Generate{" "}
                {userRole === "restaurant" ? "Portion Plan" : "Grocery List"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="results-view">
          <div className="results-header">
            <h3>{generatedPlan.name}</h3>
            <div className="results-meta">
              <span>Plan ID: {generatedPlan.planId}</span>
              <span>People : {generatedPlan.peopleCount}</span>
              <span>Total Cost : Rs {generatedPlan.totalCost?.toFixed(2)}</span>
              <span>
                Cost / Person: Rs {generatedPlan.costPerPerson?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="selected-items-summary">
            <div className="main-meal-summary">
              <h4>Main Meal</h4>
              <p>{generatedPlan.mainMeal.name}</p>
            </div>
            <div className="curries-summary">
              <h4>Curries</h4>
              {generatedPlan.curries.map((curry) => (
                <p key={curry.recipeId}>{curry.name}</p>
              ))}
            </div>
          </div>

          <div className="ingredients-list">
            <h4>Required Ingredients</h4>
            <div className="ingredients-table">
              <div className="table-header">
                <span>Item</span>
                <span>Quantity</span>
                <span>Unit</span>
                <span>Cost</span>
              </div>
              {generatedPlan.totalIngredients.map((ingredient, index) => (
                <div key={index} className="table-row">
                  <span>{ingredient.itemName}</span>
                  <span>{ingredient.totalQuantity.toFixed(3)}</span>
                  <span>{ingredient.unit}</span>
                  <span>Rs {ingredient.totalCost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <button className="pdf-btn" onClick={downloadPDF}>
              Download {userRole === "restaurant" ? "Plan" : "Grocery List"} PDF
            </button>
            {userRole === "restaurant" ? (
              <button className="execute-btn" onClick={executePortionPlan}>
                Send to the Inventory
              </button>
            ) : (
              <button className="execute-btn" onClick={executePortionPlan}>
                Generate Grocery List
              </button>
            )}
            <button className="reset-btn" onClick={resetCalculator}>
              Create New Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortionCalculator;