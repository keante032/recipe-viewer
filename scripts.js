let recipes = [];
let currentIndex = null;

document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.addEventListener('DOMContentLoaded', loadRecipesFromLocalStorage);

function handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            recipes = JSON.parse(e.target.result);
            saveRecipesToLocalStorage();
            displayRecipeCards();
        } catch (error) {
            alert('Error parsing the JSON file');
        }
    };
    
    reader.readAsText(file);
}

function displayRecipeCards() {
    const recipeList = document.getElementById('recipeList');
    recipeList.innerHTML = '';

    recipes.forEach((recipe, index) => {
        const card = document.createElement('div');
        card.classList.add('recipe-card');
        card.innerHTML = `
            <h3>${recipe.name}</h3>
            ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.name}">` : ''}
        `;

        card.addEventListener('click', () => showRecipeDetail(index));

        recipeList.appendChild(card);
    });
}

function filterRecipes() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const filteredRecipes = recipes.map((recipe, index) => ({ recipe, index })).filter(({ recipe }) => {
        return recipe.name.toLowerCase().includes(searchText) ||
               recipe.description.toLowerCase().includes(searchText) ||
               recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchText)) ||
               recipe.directions.some(direction => direction.toLowerCase().includes(searchText));
    });

    const recipeList = document.getElementById('recipeList');
    recipeList.innerHTML = '';

    filteredRecipes.forEach(({ recipe, index }) => {
        const card = document.createElement('div');
        card.classList.add('recipe-card');
        card.innerHTML = `
            <h3>${recipe.name}</h3>
            ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.name}">` : ''}
        `;

        card.addEventListener('click', () => showRecipeDetail(index));

        recipeList.appendChild(card);
    });
}

function showRecipeDetail(index) {
    currentIndex = index;
    const recipe = recipes[index];
    const detailContent = document.getElementById('detailContent');
    
    let ingredientsHtml = '<ul>';
    recipe.ingredients.forEach(ingredient => {
        ingredientsHtml += `<li>${ingredient}</li>`;
    });
    ingredientsHtml += '</ul>';

    let directionsHtml = '<ol>';
    recipe.directions.forEach(direction => {
        directionsHtml += `<li>${direction}</li>`;
    });
    directionsHtml += '</ol>';

    detailContent.innerHTML = `
        <h2 id="recipeName">${recipe.name}</h2>
        <h3>Description</h3>
        <p id="recipeDescription">${recipe.description || ''}</p>
        <h3>Ingredients</h3>
        ${ingredientsHtml}
        <h3>Directions</h3>
        ${directionsHtml}
    `;

    document.getElementById('loadButtons').style.display = 'none';
    document.getElementById('searchInput').style.display = 'none';
    document.getElementById('recipeList').style.display = 'none';
    document.getElementById('recipeDetail').style.display = 'block';

    const editSaveButton = document.getElementById('editSaveButton');
    editSaveButton.innerText = 'Edit Recipe';
}

function toggleEditMode() {
    const editSaveButton = document.getElementById('editSaveButton');
    const detailContent = document.getElementById('detailContent');

    if (editSaveButton.innerText === 'Edit Recipe') {
        enterEditMode(detailContent);
        editSaveButton.innerText = 'Save Changes';
    } else {
        saveRecipeChanges();
        editSaveButton.innerText = 'Edit Recipe';
    }
}

function enterEditMode(detailContent) {
    const recipe = recipes[currentIndex];

    let ingredientsHtml = '<ul id="ingredientsList">';
    recipe.ingredients.forEach((ingredient, index) => {
        ingredientsHtml += `<li><input type="text" value="${ingredient}" class="ingredientInput" /> <button onclick="removeIngredient(${index})">Remove</button></li>`;
    });
    ingredientsHtml += '</ul><button onclick="addIngredient()">Add Ingredient</button>';

    let directionsHtml = '<ol id="directionsList">';
    recipe.directions.forEach((direction, index) => {
        directionsHtml += `<li><textarea class="directionInput">${direction}</textarea> <button onclick="removeDirection(${index})">Remove</button></li>`;
    });
    directionsHtml += '</ol><button onclick="addDirection()">Add Direction</button>';

    detailContent.innerHTML = `
        <h2><input type="text" id="recipeName" value="${recipe.name}" /></h2>
        <h3>Description</h3>
        <textarea id="recipeDescription">${recipe.description || ''}</textarea>
        <h3>Ingredients</h3>
        ${ingredientsHtml}
        <h3>Directions</h3>
        ${directionsHtml}
    `;
}

function addIngredient() {
    const ingredientsList = document.getElementById('ingredientsList');
    const newIngredientIndex = ingredientsList.children.length;
    const newIngredient = document.createElement('li');
    newIngredient.innerHTML = `<input type="text" class="ingredientInput" /> <button onclick="removeIngredient(${newIngredientIndex})">Remove</button>`;
    ingredientsList.appendChild(newIngredient);
}

function removeIngredient(index) {
    const ingredientsList = document.getElementById('ingredientsList');
    ingredientsList.removeChild(ingredientsList.children[index]);
    updateRemoveButtons('ingredientInput', 'removeIngredient');
}

function addDirection() {
    const directionsList = document.getElementById('directionsList');
    const newDirectionIndex = directionsList.children.length;
    const newDirection = document.createElement('li');
    newDirection.innerHTML = `<textarea class="directionInput"></textarea> <button onclick="removeDirection(${newDirectionIndex})">Remove</button>`;
    directionsList.appendChild(newDirection);
}

function removeDirection(index) {
    const directionsList = document.getElementById('directionsList');
    directionsList.removeChild(directionsList.children[index]);
    updateRemoveButtons('directionInput', 'removeDirection');
}

function updateRemoveButtons(inputClass, removeFunction) {
    const inputs = document.querySelectorAll(`.${inputClass}`);
    inputs.forEach((input, index) => {
        const button = input.parentElement.querySelector('button');
        button.setAttribute('onclick', `${removeFunction}(${index})`);
    });
}

function goBack() {
    document.getElementById('loadButtons').style.display = 'flex';
    document.getElementById('searchInput').style.display = 'block';
    document.getElementById('recipeList').style.display = 'grid';
    document.getElementById('recipeDetail').style.display = 'none';
}

function saveRecipeChanges() {
    const updatedRecipe = {
        name: document.getElementById('recipeName').value,
        description: document.getElementById('recipeDescription').value,
        ingredients: Array.from(document.querySelectorAll('.ingredientInput')).map(input => input.value),
        directions: Array.from(document.querySelectorAll('.directionInput')).map(input => input.value)
    };

    recipes[currentIndex] = updatedRecipe;
    saveRecipesToLocalStorage();
    alert('Recipe changes saved!');
    showRecipeDetail(currentIndex);
}

function downloadRecipes() {
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'updated_recipes.json';
    link.click();
}

function saveRecipesToLocalStorage() {
    localStorage.setItem('recipes', JSON.stringify(recipes));
}

function loadRecipesFromLocalStorage() {
    const storedRecipes = localStorage.getItem('recipes');
    if (storedRecipes) {
        recipes = JSON.parse(storedRecipes);
        displayRecipeCards();
    }
}

function clearRecipes() {
    localStorage.removeItem('recipes');
    recipes = [];
    displayRecipeCards();
}