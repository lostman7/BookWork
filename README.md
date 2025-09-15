# Bookworm (formerly Story Weaver)

Bookworm is a web-based application designed for collaborative story writing with AI. It provides a structured environment to manage your story's world, characters, and plot, and uses this information to generate context-aware story continuations with the help of a large language model (LLM).

This project is built with a focus on a long-term, structured memory system that allows the AI to maintain consistency over long narratives.

## Features

- **Persistent Memory**: All story elements are saved to the local file system, not just in the browser.
- **Character Management**: Create and edit characters with detailed backstories, traits, and event logs.
- **World Building**: Define the rules, locations, and lore of your story's world.
- **Structured Storage**: A clear folder structure (`books/BookName/`) keeps all your project files organized.
- **RAG-based Generation**: Uses a Retrieval-Augmented Generation (RAG) approach to inject relevant context into the AI's prompt.
- **Mode-Based UI**: Switch between "Planning Mode" to build your world and "Writing Mode" to focus on the narrative.
- **Backend Agnostic**: Designed to work with any OpenAI-compatible AI backend (e.g., Ollama, LM Studio, OpenRouter).

## Project Architecture

The project is a standard Node.js web application with a vanilla JavaScript frontend.

- **`server.js`**: The main backend file, built with Express.js. It serves the frontend, provides the API for memory operations, and orchestrates the AI generation process.
- **`public/`**: Contains all the frontend files.
  - `index.html`: The main HTML file.
  - `style.css`: The stylesheet.
  - `app.js`: The client-side JavaScript that handles the UI and API calls.
- **`ai-handler.js`**: A module that abstracts the connection to the AI backend. This is the **only file you need to edit** to connect to your preferred AI service.
- **`books/`**: The root directory where all your story projects are stored.

## The Memory System

Bookworm's key feature is its file-based memory structure. When you start a project, a new folder is created inside the `books/` directory (e.g., `books/MyFirstBook/`).

- **`characters/`**: Contains one JSON file for each character (e.g., `Arin.json`). Each file stores the character's name, personality, background, etc.
- **`world/`**: Contains JSON files for world-building information.
  - `lore.json`: Stores details about the setting, rules, tone, etc.
  - `timeline.json`: Can be used to store a chronological sequence of events.
- **`story/`**: Contains the actual story, broken down into pages. Each file is a Markdown file named sequentially (e.g., `ch1-p01.md`, `ch1-p02.md`).

## How to Run Locally

1.  **Prerequisites**: You must have [Node.js](https://nodejs.org/) and npm installed.

2.  **Install Dependencies**: Open a terminal in the project root and run:
    ```bash
    npm install
    ```

3.  **Start the Server**:
    ```bash
    npm start
    ```
    This will start the web server on `http://localhost:3000`.

4.  **Open in Browser**: Open your web browser and navigate to `http://localhost:3000`.

## Connecting to an AI Backend

By default, the application runs in a **mocked AI mode**. It does not make real calls to an AI service. To connect it to a real LLM, you need to edit the `ai-handler.js` file.

1.  **Open `ai-handler.js`**.
2.  **Set your API Endpoint and Key**: Modify the `AI_API_URL` and `AI_API_KEY` constants at the top of the file. Examples for common services are provided.
3.  **Enable the Real API Call**:
    -   Comment out the `Mock AI Response` section.
    -   Uncomment the `Real API Call` section.
4.  **Restart the Server**: If the server was running, stop it (`Ctrl+C`) and start it again (`npm start`).

The application will now send requests to your configured AI backend.

## API Endpoints

The server provides the following REST API for managing the story memory:

- `GET /api/book/:bookName/world`: Get world data.
- `POST /api/book/:bookName/world`: Update world data.
- `GET /api/book/:bookName/characters`: Get a list of all characters.
- `POST /api/book/:bookName/character/:charName`: Create or update a character.
- `DELETE /api/book/:bookName/character/:charName`: Delete a character.
- `GET /api/book/:bookName/story`: Get the full story content.
- `POST /api/book/:bookName/generate`: Generate the next part of the story.
  - **Body**: `{ "prompt": "...", "injectionMode": "global" | "local" }`
