import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaRegBookmark,
  FaBookmark,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const ChatBot = ({ selectedIngredients }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const typingInterval = useRef(null);
  const [formData, setFormData] = useState({ imageFile: null });
  const [isSaved, setIsSaved] = useState(false);
  const [showSavedRecipes, setShowSavedRecipes] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [videos, setVideos] = useState([]);  

  const {
    transcript,
    listening: isListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const updateQuestionWithTranscript = () => {
    setQuestion(
      (prevVal) =>
        prevVal +
        (transcript.length ? (prevVal.length ? " " : "") + transcript : "")
    );
  };

  useEffect(() => {
    setQuestion(selectedIngredients.join(", "));
  }, [selectedIngredients]);

  const fetchYouTubeVideos = async (query) => {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            part: "snippet",
            maxResults: 6,
            q: encodedQuery,
            type: "video",
            key: import.meta.env.VITE_YT_API_KEY, 
          },
        }
      );
      setVideos(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch YouTube videos", error);
    }
  };
  

  async function generateAnswer() {
    setIsSaved(false);
    setAnswer(" Generating Recipe for you......   \n");
    setDisplayedAnswer("");
    setVideos([]);

    let parts = [{ text: question }];

    if (formData.imageFile) {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1];
        parts.push({
          inlineData: {
            mimeType: formData.imageFile.type,
            data: base64Image,
          },
        });

        try {
          const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyCHrQPatxa4br9w2NQyyWm_yywWuvrAYNU",
            {
              contents: [{ parts }],
            }
          );

          const generatedText =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Failed to retrieve recipe.";
          setAnswer(generatedText);
          await fetchYouTubeVideos(question); 
        } catch (error) {
          console.error(error);
          setAnswer("Failed to generate recipe. Please try again.");
        }
      };

      reader.readAsDataURL(formData.imageFile);
    } else {
      try {
        const response = await axios.post(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyCHrQPatxa4br9w2NQyyWm_yywWuvrAYNU",
          {
            contents: [{ parts }],
          }
        );

        const generatedText =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Failed to retrieve recipe.";
        setAnswer(generatedText);
        await fetchYouTubeVideos(question); 
      } catch (error) {
        console.error(error);
        setAnswer("Failed to generate recipe. Please try again.");
      }
    }
  }

  const handleChange = (e) => {
    const { name, files } = e.target;
    if (name === "imageFile") {
      setFormData({ ...formData, imageFile: files[0] });
    }
  };

  const handleSaveRecipe = () => {
    const saved = JSON.parse(localStorage.getItem("savedRecipes")) || [];
    const newRecipe = {
      ingredients: question,
      recipe: answer,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("savedRecipes", JSON.stringify([newRecipe, ...saved]));
    setIsSaved(true);
  };

  const toggleSave = () => {
    if (!isSaved) {
      handleSaveRecipe();
    } else {
      const saved = JSON.parse(localStorage.getItem("savedRecipes")) || [];
      const updated = saved.filter((r) => r.recipe !== answer);
      localStorage.setItem("savedRecipes", JSON.stringify(updated));
      setIsSaved(false);
    }
  };

  const toggleSavedRecipes = () => {
    if (!showSavedRecipes) {
      const recipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];
      setSavedRecipes(recipes);
    }
    setShowSavedRecipes(!showSavedRecipes);
  };

  const startStopListening = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
      updateQuestionWithTranscript();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  useEffect(() => {
    if (!answer) return;

    let index = 0;
    clearInterval(typingInterval.current);

    typingInterval.current = setInterval(() => {
      if (index < answer.length) {
        setDisplayedAnswer((prev) => prev + answer[index]);
        index++;
      } else {
        clearInterval(typingInterval.current);
      }
    }, 20);

    return () => clearInterval(typingInterval.current);
  }, [answer]);

  if (!browserSupportsSpeechRecognition) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  return (
    <div className="bg-sky-100 p-4 rounded-lg shadow-md relative">
      <h1 className="text-2xl font-bold mb-4">Mom AI - Recipe Generator</h1>

      <textarea
        className="border rounded w-full mb-4 p-2"
        value={
          isListening
            ? question +
              (transcript.length
                ? (question.length ? " " : "") + transcript
                : "")
            : question
        }
        onChange={(e) => setQuestion(e.target.value)}
        cols="10"
        rows="3"
        placeholder="Which ingredients recipe do you want today?"
      />

      <div className="flex justify-around items-center w-[60%] flex-wrap gap-3">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={generateAnswer}
        >
          Generate Recipe
        </button>

        <label className="flex flex-col items-center w-[12%] h-[6.1vh] justify-center border-[1px] border-gray-400 rounded-md cursor-pointer hover:bg-gray-50 overflow-hidden">
          {formData.imageFile ? (
            <img
              src={URL.createObjectURL(formData.imageFile)}
              alt="preview"
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-xl text-gray-400">+</span>
          )}
          <input
            type="file"
            name="imageFile"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </label>

        <button
          onClick={startStopListening}
          className={`px-4 py-2 rounded flex items-center justify-center w-[12%] h-[6.1vh] text-white ${
            isListening ? "bg-red-500 animate-pulse" : "bg-green-500"
          } hover:opacity-90`}
        >
          {isListening ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>

        {displayedAnswer && (
          <button
            onClick={toggleSave}
            className=" bg-green-500 text-white px-4 py-2 flex justify-center items-center w-[12%] h-[6.1vh] text-xl rounded hover:bg-green-600"
          >
            {isSaved ? <FaBookmark /> : <FaRegBookmark />}
          </button>
        )}
        <button
          onClick={toggleSavedRecipes}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          See Recipes
        </button>
      </div>

      <div className="mt-4">
        <pre className="whitespace-pre-wrap font-inter font-semibold text-lg leading-relaxed">
          {displayedAnswer
            .replaceAll("**", "")
            .replaceAll("#", "\n")
            .replaceAll("*", "")
            .replaceAll("undefined", "")}
        </pre>
      </div>

      {/* Slide-in Saved Recipes Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[300px] bg-white shadow-lg border-l border-gray-300 transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
          showSavedRecipes ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Saved Recipes</h2>
          <button
            onClick={toggleSavedRecipes}
            className="text-red-500 font-bold"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          {savedRecipes.length > 0 ? (
            savedRecipes.map((recipe, index) => (
              <div key={index} className="mb-4 p-2 border rounded bg-gray-100">
                <p className="font-semibold">Ingredients:</p>
                <p>{recipe.ingredients}</p>
                <p className="mt-2 font-semibold">Recipe:</p>
                <pre className="whitespace-pre-wrap text-sm">
                  {recipe.recipe
                    .replaceAll("**", "")
                    .replaceAll("#", "\n")
                    .replaceAll("*", "")
                    .replaceAll("undefined", "")}
                </pre>
              </div>
            ))
          ) : (
            <p>No saved recipes found.</p>
          )}
        </div>
      </div>

      {/* Horizontal YouTube Videos Section */}
      {videos.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Watch Related Recipes</h2>
          <div className="flex overflow-x-auto gap-4 pb-4">
            {videos.map((video) => (
              <a
                key={video.id.videoId}
                href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[250px] bg-white border rounded shadow hover:scale-105 transform transition"
              >
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                  className="w-full h-40 object-cover rounded-t"
                />
                <div className="p-2 text-sm font-medium">
                  {video.snippet.title}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
