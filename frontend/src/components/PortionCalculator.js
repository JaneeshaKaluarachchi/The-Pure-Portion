import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/PortionCalculator.css';

const PortionCalculator = () => {
  const [recipes, setRecipes] = useState([]);
  const [selectedMainMeal, setSelectedMainMeal] = useState(null);
  const [selectedCurries, setSelectedCurries] = useState([]);
  const [peopleCount, setPeopleCount] = useState(1);
  const [planName, setPlanName] = useState('');
  const [userType, setUserType] = useState('restaurant');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Separate recipes by category
  const mealRecipes = recipes.filter(recipe => 
    recipe.category !== 'curry' && 
    ['rice', 'bread', 'main-course'].includes(recipe.category)
  );
  const curryRecipes = recipes.filter(recipe => recipe.category === 'curry');

  useEffect(() => {
    fetchRecipes();
    // Get user type from localStorage or API
    const savedUserType = localStorage.getItem('userType') || 'restaurant';
    setUserType(savedUserType);
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/recipes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecipes(response.data.recipes || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, recipe, type) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ recipe, type }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleMainMealDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.type === 'meal') {
      setSelectedMainMeal(data.recipe);
    }
  };

  const handleCurryDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.type === 'curry' && selectedCurries.length < 5) {
      if (!selectedCurries.find(curry => curry._id === data.recipe._id)) {
        setSelectedCurries([...selectedCurries, data.recipe]);
      }
    }
  };

  const removeCurry = (curryId) => {
    setSelectedCurries(selectedCurries.filter(curry => curry._id !== curryId));
  };

  const generatePortionPlan = async () => {
    if (!selectedMainMeal || selectedCurries.length === 0 || !planName) {
      alert('Please select a main meal, at least one curry, and enter a plan name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const planData = {
        name: planName,
        mainMeal: {
          recipeId: selectedMainMeal._id
        },
        curries: selectedCurries.map(curry => ({
          recipeId: curry._id
        })),
        peopleCount: parseInt(peopleCount),
        userType
      };

      const response = await axios.post('http://localhost:5000/api/portions', planData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGeneratedPlan(response.data.portionPlan);
      setShowResults(true);
    } catch (error) {
      console.error('Error generating portion plan:', error);
      setError('Failed to generate portion plan: ' + (error.response?.data?.message || error.message));
    }
  };

  const executePortionPlan = async () => {
    if (!generatedPlan) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/portions/${generatedPlan._id}/execute`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(userType === 'restaurant' 
        ? 'Portion plan executed! Inventory has been deducted.'
        : 'Grocery list generated successfully!'
      );
    } catch (error) {
      console.error('Error executing portion plan:', error);
      alert('Failed to execute portion plan: ' + (error.response?.data?.message || error.message));
    }
  };

  const downloadPDF = async () => {
    if (!generatedPlan) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/portions/${generatedPlan._id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portion-plan-${generatedPlan.planId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const resetCalculator = () => {
    setSelectedMainMeal(null);
    setSelectedCurries([]);
    setPeopleCount(1);
    setPlanName('');
    setGeneratedPlan(null);
    setShowResults(false);
    setError('');
  };

  if (loading) return <div className="loading">Loading recipes...</div>;

  return (
    <div className="portion-calculator">
      <div className="calculator-header">
        <h2>Portion Calculator</h2>
        <div className="user-type-selector">
          <label>
            <input
              type="radio"
              value="restaurant"
              checked={userType === 'restaurant'}
              onChange={(e) => setUserType(e.target.value)}
            />
            Restaurant
          </label>
          <label>
            <input
              type="radio"
              value="household"
              checked={userType === 'household'}
              onChange={(e) => setUserType(e.target.value)}
            />
            Household
          </label>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!showResults ? (
        <div className="calculator-content">
          {/* Left Side - Recipe Selection */}
          <div className="recipe-selection">
            <div className="recipe-section">
              <h3>Main Meals 🍽️</h3>
              <div className="recipe-list">
                {mealRecipes.map(recipe => (
                  <div
                    key={recipe._id}
                    className="recipe-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, recipe, 'meal')}
                  >
                    {recipe.imageUrl && (
                      <img src={recipe.imageUrl} alt={recipe.name} className="recipe-thumb" />
                    )}
                    <div className="recipe-info">
                      <h4>{recipe.name}</h4>
                      <p>{recipe.category}</p>
                      <span>Rs{recipe.costPerServing?.toFixed(2) || '0.00'}/serving</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="recipe-section">
              <h3>Curries 🍛</h3>
              <div className="recipe-list">
                {curryRecipes.map(recipe => (
                  <div
                    key={recipe._id}
                    className="recipe-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, recipe, 'curry')}
                  >
                    {recipe.imageUrl && (
                      <img src={recipe.imageUrl} alt={recipe.name} className="recipe-thumb" />
                    )}
                    <div className="recipe-info">
                      <h4>{recipe.name}</h4>
                      <p>{recipe.subcategory} curry</p>
                      <span>Rs{recipe.costPerServing?.toFixed(2) || '0.00'}/serving</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Selection Area */}
          <div className="selection-area">
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

            {/* Main Meal Drop Zone */}
            <div className="drop-zone-section">
              <h3>Selected Main Meal</h3>
              <div
                className="drop-zone main-meal-zone"
                onDragOver={handleDragOver}
                onDrop={handleMainMealDrop}
              >
                {selectedMainMeal ? (
                  <div className="selected-recipe">
                    {selectedMainMeal.imageUrl && (
                      <img src={selectedMainMeal.imageUrl} alt={selectedMainMeal.name} />
                    )}
                    <div className="recipe-details">
                      <h4>{selectedMainMeal.name}</h4>
                      <p>{selectedMainMeal.category}</p>
                      <button
                        className="remove-btn"
                        onClick={() => setSelectedMainMeal(null)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="drop-placeholder">
                    <p>Drag and drop a main meal here</p>
                    <span>🍽️</span>
                  </div>
                )}
              </div>
            </div>

            {/* Curries Drop Zone */}
            <div className="drop-zone-section">
              <h3>Selected Curries (Max 5)</h3>
              <div
                className="drop-zone curries-zone"
                onDragOver={handleDragOver}
                onDrop={handleCurryDrop}
              >
                {selectedCurries.length > 0 ? (
                  <div className="selected-curries">
                    {selectedCurries.map(curry => (
                      <div key={curry._id} className="selected-curry">
                        {curry.imageUrl && (
                          <img src={curry.imageUrl} alt={curry.name} />
                        )}
                        <div className="curry-details">
                          <h5>{curry.name}</h5>
                          <p>{curry.subcategory}</p>
                          <button
                            className="remove-btn"
                            onClick={() => removeCurry(curry._id)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="drop-placeholder">
                    <p>Drag and drop curries here (up to 5)</p>
                    <span>🍛</span>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <div className="action-buttons">
              <button
                className="generate-btn"
                onClick={generatePortionPlan}
                disabled={!selectedMainMeal || selectedCurries.length === 0 || !planName}
              >
                Generate {userType === 'restaurant' ? 'Portion Plan' : 'Grocery List'}
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
              <span>People: {generatedPlan.peopleCount}</span>
              <span>Total Cost: ${generatedPlan.totalCost?.toFixed(2)}</span>
              <span>Cost/Person: ${generatedPlan.costPerPerson?.toFixed(2)}</span>
            </div>
          </div>

          <div className="selected-items-summary">
            <div className="main-meal-summary">
              <h4>Main Meal</h4>
              <p>{generatedPlan.mainMeal.name}</p>
            </div>
            <div className="curries-summary">
              <h4>Curries</h4>
              {generatedPlan.curries.map(curry => (
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
                  <span>{ingredient.totalQuantity.toFixed(2)}</span>
                  <span>{ingredient.unit}</span>
                  <span>Rs{ingredient.totalCost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <button className="pdf-btn" onClick={downloadPDF}>
              Download PDF
            </button>
            <button className="execute-btn" onClick={executePortionPlan}>
              {userType === 'restaurant' ? 'Execute & Deduct Inventory' : 'Generate Grocery List'}
            </button>
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