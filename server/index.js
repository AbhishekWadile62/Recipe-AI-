const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();


// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mkbot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Enable CORS
app.use(cors());


const PORT = 5501;

// Middleware
app.use(cors());
app.use(express.json()); // Enables JSON request handling

// Store selected ingredients
let selectedIngredients = [];

// Default Route - Prevents "Cannot GET /" error
app.get("/", (req, res) => {
    res.send("Server is running successfully!");
});

// Pantry Route - Fetches Available Ingredients
app.get("/pantry", (req, res) => {
    try {
        const pantryItems = [
            "Butter", "Egg", "Garlic", "Milk", "Onion",
            "Sugar", "Flour", "Olive Oil", "Garlic Powder",
            "White Rice", "Cinnamon", "Ketchup", "Soy Sauce", "Mayonnaise"
        ];
        res.status(200).json({ pantry: pantryItems });
    } catch (error) {
        res.status(500).json({ message: "Error fetching pantry data" });
    }
});

// Route to Select Ingredients & Track Count
app.post("/select-ingredient", (req, res) => {
    const { ingredient } = req.body;
    
    if (!ingredient) {
        return res.status(400).json({ message: "No ingredient provided" });
    }

    if (!selectedIngredients.includes(ingredient)) {
        selectedIngredients.push(ingredient);
    }

    res.status(200).json({ selectedIngredients, count: selectedIngredients.length });
});

// Get Selected Ingredients
app.get("/selected-ingredients", (req, res) => {
    res.status(200).json({ selectedIngredients, count: selectedIngredients.length });
});

// Chatbot Route - Generates Recipe (Placeholder)
app.post("/chatbot", (req, res) => {
    const { ingredients } = req.body;

    if (!ingredients || ingredients.length === 0) {
        return res.status(400).json({ message: "No ingredients provided" });
    }

    res.status(200).json({
        message: "Recipe generated successfully",
        recipe: {
            prepTime: "10 mins",
            cookTime: "20 mins",
            servings: 2,
            ingredients,
            cookingMethod: "Fry in a pan for 10 minutes.",
            tips: "Use fresh ingredients for better taste."
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
