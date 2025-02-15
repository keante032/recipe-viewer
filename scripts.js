let recipes = [];
let currentIndex = null;

document.getElementById("fileInput").addEventListener("change", handleFileSelect);
document.addEventListener("DOMContentLoaded", loadRecipesFromLocalStorage);

function handleFileSelect(event) {
	const file = event.target.files[0];

	if (!file) return;

	const reader = new FileReader();

	reader.onload = function (e) {
		try {
			recipes = JSON.parse(e.target.result);
			saveRecipesToLocalStorage();
			displayRecipeCards();
		} catch (error) {
			alert("Error parsing the JSON file");
		}
	};

	reader.readAsText(file);
}

function displayRecipeCards() {
	const recipeList = document.getElementById("recipeList");
	recipeList.innerHTML = "";

	recipes.forEach((recipe, index) => {
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

	detailContent.innerHTML = `
        <h2 id="recipeName">${recipe.name}</h2>
        <h3>Description</h3>
        <p id="recipeDescription">${recipe.description || ""}</p>
        <h3>Ingredients</h3>
        ${ingredientsHtml}
        <h3>Directions</h3>
        ${directionsHtml}
    `;

	document.getElementById("loadButtons").style.display = "none";
	document.getElementById("searchInput").style.display = "none";
	document.getElementById("recipeList").style.display = "none";
	document.getElementById("recipeDetail").style.display = "block";

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
		deleteButton.style.display = "inline-block";
	} else {
		saveRecipeChanges();
		editSaveButton.innerText = "Edit Recipe";
		deleteButton.style.display = "none";
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
	const section = document.querySelector(`.direction-section[data-section-index="${index}"]`);
	section.parentElement.removeChild(section);
	updateSectionIndices(".direction-section", "directionTextarea", "removeDirectionSection");
}

function updateSectionIndices(sectionClass, textareaClass, removeFunction) {
	const sections = document.querySelectorAll(sectionClass);
	sections.forEach((section, index) => {
		section.setAttribute("data-section-index", index);
		const textarea = section.querySelector(`.${textareaClass}`);
		textarea.setAttribute("data-section-index", index);
		const button = section.querySelector("button");
		button.setAttribute("onclick", `${removeFunction}(${index})`);
	});
}

function goBack() {
	document.getElementById("loadButtons").style.display = "flex";
	document.getElementById("searchInput").style.display = "block";
	document.getElementById("recipeList").style.display = "grid";
	document.getElementById("recipeDetail").style.display = "none";
	document.getElementById("deleteButton").style.display = "none";
}

function saveRecipeChanges() {
	const updatedRecipe = {
		name: document.getElementById("recipeName").value,
		description: document.getElementById("recipeDescription").value,
		imageUrl: document.getElementById("recipeImageUrl").value,
		ingredients: [],
		directions: []
	};

	const ingredientSections = document.querySelectorAll(".ingredientSectionTitle");
	ingredientSections.forEach((sectionTitle, sectionIndex) => {
		const section = {
			title: sectionTitle.value,
			items: []
		};
		const textarea = document.querySelector(`.ingredientTextarea[data-section-index="${sectionIndex}"]`);
		section.items = textarea.value
			.split("\n")
			.map((item) => item.trim())
			.filter((item) => item);
		updatedRecipe.ingredients.push(section);
	});

	const directionSections = document.querySelectorAll(".directionSectionTitle");
	directionSections.forEach((sectionTitle, sectionIndex) => {
		const section = {
			title: sectionTitle.value,
			items: []
		};
		const textarea = document.querySelector(`.directionTextarea[data-section-index="${sectionIndex}"]`);
		section.items = textarea.value
			.split("\n")
			.map((item) => item.trim())
			.filter((item) => item);
		updatedRecipe.directions.push(section);
	});

	recipes[currentIndex] = updatedRecipe;
	saveRecipesToLocalStorage();
	alert("Recipe changes saved!");
	showRecipeDetail(currentIndex);
}

function downloadRecipes() {
	const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: "application/json" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "updated_recipes.json";
	link.click();
}

function saveRecipesToLocalStorage() {
	localStorage.setItem("recipes", JSON.stringify(recipes));
}

function loadRecipesFromLocalStorage() {
	const storedRecipes = localStorage.getItem("recipes");
	if (storedRecipes) {
		recipes = JSON.parse(storedRecipes);
		displayRecipeCards();
	}
}

function clearRecipes() {
	localStorage.removeItem("recipes");
	recipes = [];
	displayRecipeCards();
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
