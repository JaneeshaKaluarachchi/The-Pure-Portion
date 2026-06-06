import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
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
  const [searchError, setSearchError] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [showRecentPortions, setShowRecentPortions] = useState(false);
  const [recentPortions, setRecentPortions] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

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
  const filteredMeals = mealRecipes.filter(
    (meal) =>
      meal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meal.category || "Other")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (meal.subcategory || "Other")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );
  // Add this helper function
  const formatIngredientQuantity = (quantity, unit) => {
    if (unit === "kg" && quantity < 1) {
      return {
        displayQuantity: (quantity * 1000).toFixed(0),
        displayUnit: "g",
      };
    } else if (unit === "l" && quantity < 1) {
      return {
        displayQuantity: (quantity * 1000).toFixed(0),
        displayUnit: "ml",
      };
    } else {
      return { displayQuantity: quantity.toFixed(3), displayUnit: unit };
    }
  };

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
      console.log(
        "Auto-detected user role from AuthContext:",
        currentUser.role
      );
    }
    fetchRecipes();
  }, [currentUser]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/recipes", {
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
        "/api/portions",
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
        `/api/portions/${generatedPlan._id}/execute`,
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
        `/api/portions/${generatedPlan._id}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        userRole === "restaurant" ? "portion-plan" : "grocery-list"
      }-${generatedPlan.planId}.pdf`;
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

  // Fetch recent portions
  const fetchRecentPortions = async () => {
    try {
      setLoadingRecent(true);
      setError("");
      const token = localStorage.getItem("token");

      console.log("Fetching recent portions...");
      const response = await axios.get("/api/portions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("API Response:", response.data);

      const allPlans = response.data.plans || [];
      console.log(`Found ${allPlans.length} total plans`);

      const sortedPortions = allPlans
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      console.log(`Showing ${sortedPortions.length} recent plans`);
      setRecentPortions(sortedPortions);
      setShowRecentPortions(true);
    } catch (error) {
      console.error("Error fetching recent portions:", error);
      setError(
        `Failed to fetch recent portions: ${
          error.response?.data?.message || error.message
        }`
      );
      setShowRecentPortions(false);
    } finally {
      setLoadingRecent(false);
    }
  };

  // Reuse a portion plan - populate calculator for modification
  const reusePortionPlan = async (plan) => {
    try {
      setLoadingRecent(true);
      const token = localStorage.getItem("token");

      console.log("Reusing plan - full plan data:", plan);

      // Extract recipe ID (handle both populated and non-populated cases)
      const mainMealId = plan.mainMeal.recipeId?._id || plan.mainMeal.recipeId;
      console.log("Main meal recipe ID:", mainMealId);

      if (!mainMealId) {
        throw new Error("Main meal recipe ID not found");
      }

      // Fetch full recipe details for main meal
      const mainMealRecipe = await axios.get(
        `/api/recipes/${mainMealId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Main meal recipe response:", mainMealRecipe.data);

      // Backend returns { message, recipe } - extract the recipe
      const mainMealData = mainMealRecipe.data.recipe || mainMealRecipe.data;
      console.log("Main meal recipe data:", mainMealData);

      // Fetch full recipe details for curries
      const curryPromises = plan.curries.map((curry) => {
        const curryId = curry.recipeId?._id || curry.recipeId;
        console.log("Fetching curry recipe ID:", curryId);
        return axios.get(`/api/recipes/${curryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      });
      const curryResponses = await Promise.all(curryPromises);

      console.log("All curries fetched:", curryResponses.length);

      // Set the selected items - extract recipe from response
      const fetchedCurries = curryResponses.map(
        (res) => res.data.recipe || res.data
      );
      setSelectedMainMeal(mainMealData);
      setSelectedCurries(fetchedCurries);

      // Update portions on plate
      const newPortions = {
        center: mainMealData,
        curry1: fetchedCurries[0] || null,
        curry2: fetchedCurries[1] || null,
        curry3: fetchedCurries[2] || null,
        curry4: fetchedCurries[3] || null,
        curry5: fetchedCurries[4] || null,
      };
      setPortions(newPortions);

      console.log("Portions set on plate:", newPortions);

      // Set plan name and people count (user can modify these)
      setPlanName(plan.name);
      setPeopleCount(plan.peopleCount);

      // Close the modal and show calculator form
      setShowRecentPortions(false);
      setShowResults(false);
      setError("");

      console.log(
        "Plan loaded into calculator. You can now modify and generate."
      );
    } catch (error) {
      console.error("Error reusing portion plan:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = "Failed to load portion plan: ";
      if (error.response) {
        // Server responded with error
        errorMessage +=
          error.response.data?.message ||
          `Server error (${error.response.status})`;
      } else if (error.request) {
        // Request made but no response
        errorMessage +=
          "No response from server. Please check if backend is running.";
      } else {
        // Something else went wrong
        errorMessage += error.message;
      }

      setError(errorMessage);
    } finally {
      setLoadingRecent(false);
    }
  };

  // View a portion plan - directly shows the existing plan details
  const viewPortionPlan = async (plan) => {
    try {
      setLoadingRecent(true);

      console.log("Opening plan for viewing:", plan);

      // Directly set the plan and show results page
      setGeneratedPlan(plan);
      setShowResults(true);
      setShowRecentPortions(false);
      setError("");
    } catch (error) {
      console.error("Error opening portion plan:", error);
      setError(
        "Failed to open portion plan: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoadingRecent(false);
    }
  };

  // Delete a portion plan
  const deletePortionPlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this portion plan?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/portions/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove from the list
      setRecentPortions(recentPortions.filter((plan) => plan._id !== planId));
      alert("Portion plan deleted successfully");
    } catch (error) {
      console.error("Error deleting portion plan:", error);
      setError("Failed to delete portion plan");
    }
  };

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

  // Add these states
  const [planNameError, setPlanNameError] = useState("");
  const [peopleCountError, setPeopleCountError] = useState("");

  // Validation handlers
  const handlePlanNameChange = (e) => {
    const value = e.target.value;
    setPlanName(value);

    // Allow letters, numbers, spaces, parentheses ( and )
    const regex = /^[a-zA-Z\s()]*$/;

    if (!regex.test(value)) {
      setPlanNameError("Plan name can only contain letters, spaces, and ()");
    } else if (value.trim() === "") {
      setPlanNameError("Plan name cannot be empty");
    } else {
      setPlanNameError("");
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Allow letters, numbers, spaces, parentheses ( and )
    const regex = /^[a-zA-Z\s()]*$/;

    if (!regex.test(value)) {
      setSearchError("Search can only contain letters, spaces, and ( )");
    } else {
      setSearchError("");
    }
  };

  const handlePeopleCountChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setPeopleCount(value);

    if (isNaN(value) || value < 1) {
      setPeopleCountError("Number of people must be at least 1");
    } else if (value > 20000) {
      setPeopleCountError("Number of people cannot exceed 20,000");
    } else {
      setPeopleCountError("");
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="portion-calculator">
      <div className="calculator-header">
        <div className="header-content">
          {showResults && (
            <button
              className="back-arrow"
              onClick={goBackToPortionSelection}
              title="Go back to portion selection"
            >
              ←
            </button>
          )}
          <h2>Portion Calculator 🍽️</h2>
        </div>
        <div className="header-actions">
          <button
            className="recent-portions-btn"
            onClick={fetchRecentPortions}
            title="View recent portion plans"
          >
            📋 Recent Portions
          </button>
          <NotificationCenter
            module="portion_calculator"
            onNotificationUpdate={handleNotificationUpdate}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Recent Portions Modal */}
      {showRecentPortions && (
        <div
          className="modal-overlay"
          onClick={() => setShowRecentPortions(false)}
        >
          <div
            className="recent-portions-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Recent Portion Plans</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowRecentPortions(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              {loadingRecent ? (
                <div className="loading-spinner">Loading...</div>
              ) : recentPortions.length === 0 ? (
                <div className="no-portions-message">
                  <p>No recent portion plans found</p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#999",
                      marginTop: "10px",
                    }}
                  >
                    Create a portion plan to see it listed here
                  </p>
                </div>
              ) : (
                <div className="portions-list">
                  {recentPortions.map((plan) => {
                    const mainMealName =
                      plan.mainMeal?.name || "Unknown Main Meal";
                    const curriesNames =
                      (plan.curries || [])
                        .map((c) => c.name || "Unknown")
                        .join(", ") || "No curries";

                    return (
                      <div key={plan._id} className="portion-card">
                        <div className="portion-card-header">
                          <h4>{plan.name || "Unnamed Plan"}</h4>
                          <span className="portion-date">
                            {plan.createdAt
                              ? new Date(plan.createdAt).toLocaleDateString()
                              : "Unknown date"}
                          </span>
                        </div>

                        <div className="portion-card-details">
                          <div className="portion-info">
                            <span className="info-label">Plan ID:</span>
                            <span>{plan.planId || "N/A"}</span>
                          </div>
                          <div className="portion-info">
                            <span className="info-label">People:</span>
                            <span>{plan.peopleCount || 0}</span>
                          </div>
                          <div className="portion-info">
                            <span className="info-label">Total Cost:</span>
                            <span>
                              Rs {plan.totalCost?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        </div>

                        <div className="portion-card-items">
                          <div className="portion-item">
                            <strong>Main:</strong> {mainMealName}
                          </div>
                          <div className="portion-item">
                            <strong>Curries:</strong> {curriesNames}
                          </div>
                        </div>

                        <div className="portion-card-actions">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => viewPortionPlan(plan)}
                            title="View this plan details and execute/download"
                          >
                            👁️ View
                          </button>
                          <button
                            className="action-btn reuse-btn"
                            onClick={() => reusePortionPlan(plan)}
                            title="Load recipes into calculator to modify people count and name"
                          >
                            🔄 Reuse
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => deletePortionPlan(plan._id)}
                            title="Delete this plan permanently"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                className={`search-bar ${searchError ? "invalid-input" : ""}`}
                placeholder="🔍 Search curries and meals..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchError && <p className="error-text">{searchError}</p>}
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
                            onDragStart={(e) =>
                              handleDragStart(e, recipe, "meal")
                            }
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
                                Rs{recipe.costPerServing?.toFixed(2) || "0.00"}
                                /serving
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
                            onDragStart={(e) =>
                              handleDragStart(e, recipe, "curry")
                            }
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
                                Rs{recipe.costPerServing?.toFixed(2) || "0.00"}
                                /serving
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
            {/* Plan Details */}
            <div className="plan-details">
              <div className="form-group">
                <label>Plan Name:</label>
                <input
                  type="text"
                  value={planName}
                  onChange={handlePlanNameChange}
                  placeholder="Enter plan name"
                  className={planNameError ? "invalid-input" : ""}
                />
                {planNameError && <p className="error-text">{planNameError}</p>}
              </div>

              <div className="form-group">
                <label>Number of People:</label>
                <input
                  type="number"
                  value={peopleCount}
                  onChange={handlePeopleCountChange}
                  min="1"
                  max="20000"
                  className={peopleCountError ? "invalid-input" : ""}
                />
                {peopleCountError && (
                  <p className="error-text">{peopleCountError}</p>
                )}
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
              {generatedPlan.totalIngredients.map((ingredient, index) => {
                const { displayQuantity, displayUnit } =
                  formatIngredientQuantity(
                    ingredient.totalQuantity,
                    ingredient.unit
                  );

                return (
                  <div key={index} className="table-row">
                    <span>{ingredient.itemName}</span>
                    <span>{displayQuantity}</span>
                    <span>{displayUnit}</span>
                    <span>Rs {ingredient.totalCost.toFixed(2)}</span>
                  </div>
                );
              })}
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
