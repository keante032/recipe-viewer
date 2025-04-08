let recipes = [];
let currentIndex = null;

function handleFileSelect(event) {
	try {
		const file = event.target.files[0];
		if (!file) {
			throw new Error("No file selected.");
		}

		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const parsedData = JSON.parse(e.target.result);

				// Validate JSON structure
				if (!Array.isArray(parsedData)) {
					throw new Error("Invalid JSON format: Root element must be an array.");
				}
				parsedData.forEach((recipe, index) => {
					if (typeof recipe.name !== "string" || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.directions)) {
						throw new Error(`Invalid recipe format at index ${index}.`);
					}
				});

				recipes = parsedData;
				saveRecipesToLocalStorage();
				displayRecipeCards();
			} catch (error) {
				throw new Error(`Invalid JSON format in the uploaded file: ${error.message}`);
			}
		};

		reader.onerror = () => {
			throw new Error("Error reading the file.");
		};

		reader.readAsText(file);
	} catch (error) {
		console.error("Error handling file select:", error);
		alert(`An error occurred while loading the file: ${error.message}`);
	}
}

document.getElementById("fileInput").addEventListener("change", handleFileSelect);
document.addEventListener("DOMContentLoaded", loadRecipesFromLocalStorage);

const displayRecipeCards = () => {
	const recipeList = document.getElementById("recipeList");
	recipeList.innerHTML = "";

	recipes.forEach((recipe, index) => {
		const card = document.createElement("div");
		card.classList.add("recipe-card");
		card.innerHTML = `
            <h3>${recipe.name}</h3>
            ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.name}" loading="lazy">` : ""}
        `;

		card.addEventListener("click", () => showRecipeDetail(index));

		recipeList.appendChild(card);
	});
};

function filterRecipes() {
	const searchText = document.getElementById("searchInput").value.toLowerCase();
	const filteredRecipes = recipes
		.map((recipe, index) => ({ recipe, index }))
		.filter(({ recipe }) => {
			const ingredientsMatch = recipe.ingredients.some((section) => section.title.toLowerCase().includes(searchText) || section.items.some((item) => item.toLowerCase().includes(searchText)));
			const directionsMatch = recipe.directions.some((section) => section.title.toLowerCase().includes(searchText) || section.items.some((item) => item.toLowerCase().includes(searchText)));
			return recipe.name.toLowerCase().includes(searchText) || recipe.description.toLowerCase().includes(searchText) || ingredientsMatch || directionsMatch;
		});

	const recipeList = document.getElementById("recipeList");
	recipeList.innerHTML = "";

	filteredRecipes.forEach(({ recipe, index }) => {
		const card = document.createElement("div");
		card.classList.add("recipe-card");
		card.innerHTML = `
            <h3>${recipe.name}</h3>
            ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.name}">` : ""}
        `;

		card.addEventListener("click", () => showRecipeDetail(index));

		recipeList.appendChild(card);
	});
}

function showRecipeDetail(index) {
	currentIndex = index;
	const recipe = recipes[index];
	const detailContent = document.getElementById("detailContent");

	let ingredientsHtml = "";
	recipe.ingredients.forEach((section) => {
		ingredientsHtml += `<h4>${section.title}</h4><ul>`;
		section.items.forEach((ingredient) => {
			ingredientsHtml += `<li>${ingredient}</li>`;
		});
		ingredientsHtml += "</ul>";
	});

	let directionsHtml = "";
	recipe.directions.forEach((section) => {
		directionsHtml += `<h4>${section.title}</h4><ol>`;
		section.items.forEach((direction) => {
			directionsHtml += `<li>${direction}</li>`;
		});
		directionsHtml += "</ol>";
	});

	// Add the recipe image if it exists
	const imageHtml = recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.name}" class="recipe-detail-image">` : "";

	detailContent.innerHTML = `
        ${imageHtml}
        <h2 id="recipeName">${recipe.name}</h2>
        <h3>Description</h3>
        <p id="recipeDescription">${recipe.description || ""}</p>
        <h3>Ingredients</h3>
        ${ingredientsHtml}
        <h3>Directions</h3>
        ${directionsHtml}
    `;

	document.getElementById("loadButtons").classList.add("hidden");
	document.getElementById("searchInput").classList.add("hidden");
	document.getElementById("recipeList").classList.add("hidden");
	document.getElementById("recipeDetail").classList.remove("hidden");

	const editSaveButton = document.getElementById("editSaveButton");
	editSaveButton.innerText = "Edit Recipe";
}

function toggleEditMode() {
	const editSaveButton = document.getElementById("editSaveButton");
	const deleteButton = document.getElementById("deleteButton");
	const detailContent = document.getElementById("detailContent");

	if (editSaveButton.innerText === "Edit Recipe") {
		enterEditMode(detailContent);
		editSaveButton.innerText = "Save Changes";
		deleteButton.classList.remove("hidden");
	} else {
		saveRecipeChanges();
		editSaveButton.innerText = "Edit Recipe";
		deleteButton.classList.add("hidden");
	}
}

function enterEditMode(detailContent) {
	const recipe = recipes[currentIndex];

	let ingredientsHtml = "";
	recipe.ingredients.forEach((section, sectionIndex) => {
		const ingredientLines = section.items.join("\n").split("\n").length;
		ingredientsHtml += `
            <div class="ingredient-section" data-section-index="${sectionIndex}">
                <h4><input type="text" value="${section.title}" class="ingredientSectionTitle" /></h4>
                <textarea class="ingredientTextarea" data-section-index="${sectionIndex}" rows="${ingredientLines}">${section.items.join("\n")}</textarea>
                <button onclick="removeIngredientSection(${sectionIndex})">Remove Section</button>
            </div>
        `;
	});
	ingredientsHtml += `<button onclick="addIngredientSection()">Add Ingredient Section</button>`;

	let directionsHtml = "";
	recipe.directions.forEach((section, sectionIndex) => {
		const directionLines = section.items.join("\n").split("\n").length;
		directionsHtml += `
            <div class="direction-section" data-section-index="${sectionIndex}">
                <h4><input type="text" value="${section.title}" class="directionSectionTitle" /></h4>
                <textarea class="directionTextarea" data-section-index="${sectionIndex}" rows="${directionLines}">${section.items.join("\n")}</textarea>
                <button onclick="removeDirectionSection(${sectionIndex})">Remove Section</button>
            </div>
        `;
	});
	directionsHtml += `<button onclick="addDirectionSection()">Add Direction Section</button>`;

	detailContent.innerHTML = `
        <h2><input type="text" id="recipeName" value="${recipe.name}" /></h2>
        <h3>Description</h3>
        <textarea id="recipeDescription" rows="${recipe.description.split("\n").length}">${recipe.description || ""}</textarea>
        <h3>Image URL</h3>
        <input type="text" id="recipeImageUrl" value="${recipe.imageUrl || ""}" />
        <h3>Ingredients</h3>
        <div id="ingredientsContainer">${ingredientsHtml}</div>
        <h3>Directions</h3>
        <div id="directionsContainer">${directionsHtml}</div>
    `;
}

function addIngredientSection() {
	const ingredientsContainer = document.getElementById("ingredientsContainer");
	const sectionIndex = document.querySelectorAll(".ingredient-section").length;
	const newSection = document.createElement("div");
	newSection.classList.add("ingredient-section");
	newSection.setAttribute("data-section-index", sectionIndex);
	newSection.innerHTML = `
        <h4><input type="text" class="ingredientSectionTitle" placeholder="Section Title" /></h4>
        <textarea class="ingredientTextarea" data-section-index="${sectionIndex}" placeholder="Enter ingredients, one per line"></textarea>
        <button onclick="removeIngredientSection(${sectionIndex})">Remove Section</button>
    `;
	ingredientsContainer.insertBefore(newSection, ingredientsContainer.lastElementChild);
	updateSectionIndices(".ingredient-section", "ingredientTextarea", "removeIngredientSection");
}

function removeIngredientSection(index) {
	const section = document.querySelector(`.ingredient-section[data-section-index="${index}"]`);
	section.parentElement.removeChild(section);
	updateSectionIndices(".ingredient-section", "ingredientTextarea", "removeIngredientSection");
}

function addDirectionSection() {
	const directionsContainer = document.getElementById("directionsContainer");
	const sectionIndex = document.querySelectorAll(".direction-section").length;
	const newSection = document.createElement("div");
	newSection.classList.add("direction-section");
	newSection.setAttribute("data-section-index", sectionIndex);
	newSection.innerHTML = `
        <h4><input type="text" class="directionSectionTitle" placeholder="Section Title" /></h4>
        <textarea class="directionTextarea" data-section-index="${sectionIndex}" placeholder="Enter directions, one per line"></textarea>
        <button onclick="removeDirectionSection(${sectionIndex})">Remove Section</button>
    `;
	directionsContainer.insertBefore(newSection, directionsContainer.lastElementChild);
	updateSectionIndices(".direction-section", "directionTextarea", "removeDirectionSection");
}

function removeDirectionSection(index) {
	try {
		const section = document.querySelector(`.direction-section[data-section-index="${index}"]`);
		if (!section) {
			throw new Error(`Direction section with index ${index} not found.`);
		}
		section.parentElement.removeChild(section);
		updateSectionIndices(".direction-section", "directionTextarea", "removeDirectionSection");
	} catch (error) {
		console.error("Error removing direction section:", error);
		alert("An error occurred while removing the direction section. Please try again.");
	}
}

const updateSectionIndices = (sectionClass, textareaClass, removeFunction) => {
	try {
		const sections = document.querySelectorAll(sectionClass);

		if (!sections.length) {
			throw new Error(`No sections found for class: ${sectionClass}`);
		}

		sections.forEach((section, index) => {
			// Update the section's data attribute
			section.dataset.sectionIndex = index;

			// Update the textarea's data attribute
			const textarea = section.querySelector(`.${textareaClass}`);
			if (textarea) {
				textarea.dataset.sectionIndex = index;
			} else {
				console.warn(`Textarea not found in section with index ${index}`);
			}

			// Update the button's onclick attribute
			const button = section.querySelector("button");
			if (button) {
				button.onclick = () => window[removeFunction](index);
			} else {
				console.warn(`Button not found in section with index ${index}`);
			}
		});
	} catch (error) {
		console.error("Error updating section indices:", error);
		alert("An error occurred while updating section indices. Please refresh the page and try again.");
	}
};

function goBack() {
	document.getElementById("searchInput").classList.remove("hidden");
	document.getElementById("recipeList").classList.remove("hidden");
	document.getElementById("recipeDetail").classList.add("hidden");
	document.getElementById("deleteButton").classList.add("hidden");
}

const saveRecipeChanges = () => {
	try {
		const updatedRecipe = {
			name: document.getElementById("recipeName").value.trim(),
			description: document.getElementById("recipeDescription").value.trim(),
			imageUrl: document.getElementById("recipeImageUrl").value.trim(),
			ingredients: [],
			directions: []
		};

		if (!updatedRecipe.name) {
			throw new Error("Recipe name cannot be empty.");
		}

		const ingredientSections = document.querySelectorAll(".ingredientSectionTitle");
		ingredientSections.forEach((sectionTitle, sectionIndex) => {
			const section = {
				title: sectionTitle.value.trim(),
				items: []
			};
			const textarea = document.querySelector(`.ingredientTextarea[data-section-index="${sectionIndex}"]`);
			if (textarea) {
				section.items = textarea.value
					.split("\n")
					.map((item) => item.trim())
					.filter((item) => item);
			} else {
				console.warn(`Textarea not found for ingredient section index ${sectionIndex}`);
			}
			updatedRecipe.ingredients.push(section);
		});

		const directionSections = document.querySelectorAll(".directionSectionTitle");
		directionSections.forEach((sectionTitle, sectionIndex) => {
			const section = {
				title: sectionTitle.value.trim(),
				items: []
			};
			const textarea = document.querySelector(`.directionTextarea[data-section-index="${sectionIndex}"]`);
			if (textarea) {
				section.items = textarea.value
					.split("\n")
					.map((item) => item.trim())
					.filter((item) => item);
			} else {
				console.warn(`Textarea not found for direction section index ${sectionIndex}`);
			}
			updatedRecipe.directions.push(section);
		});

		recipes[currentIndex] = updatedRecipe;
		saveRecipesToLocalStorage();
		alert("Recipe changes saved successfully!");
		showRecipeDetail(currentIndex);
	} catch (error) {
		console.error("Error saving recipe changes:", error);
		alert(`An error occurred while saving the recipe: ${error.message}`);
	}
};

function downloadRecipes() {
	const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: "application/json" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "updated_recipes.json";
	link.click();
}

function saveRecipesToLocalStorage() {
	localStorage.setItem("recipes", JSON.stringify(recipes)); // Ensure recipes is stringified
}

function loadRecipesFromLocalStorage() {
	try {
		const storedRecipes = localStorage.getItem("recipes");
		if (!storedRecipes) {
			console.warn("No recipes found in local storage.");
			return;
		}

		// Validate and parse JSON
		recipes = JSON.parse(storedRecipes);
		displayRecipeCards();
	} catch (error) {
		console.error("Error loading recipes from local storage:", error);
		alert("An error occurred while loading recipes. Local storage data may be corrupted.");
		recipes = [];
	}
}

function purgeRecipes() {
	localStorage.removeItem("recipes");
	recipes = [];
	displayRecipeCards();
}

function confirmPurgeRecipes() {
	if (confirm("Are you sure you want to purge all recipes? This action cannot be undone.")) {
		purgeRecipes();
	}
}

function addNewRecipe() {
	const newRecipe = {
		name: "New Recipe",
		description: "",
		imageUrl: "",
		ingredients: [{ title: "", items: [] }],
		directions: [{ title: "", items: [] }]
	};
	recipes.push(newRecipe);
	saveRecipesToLocalStorage();
	displayRecipeCards();
	showRecipeDetail(recipes.length - 1);
	toggleEditMode();
}

function deleteRecipe() {
	if (currentIndex !== null) {
		recipes.splice(currentIndex, 1);
		saveRecipesToLocalStorage();
		displayRecipeCards();
		goBack();
	}
}

function confirmDeleteRecipe() {
	if (confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) {
		deleteRecipe();
	}
}

function toggleMenu() {
	const loadButtons = document.getElementById("loadButtons");
	loadButtons.classList.toggle("hidden");
}
