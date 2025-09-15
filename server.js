const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { generateText } = require('./ai-handler');

const app = express();
const port = 3000;

const booksDir = path.join(__dirname, 'books');

app.use(express.static('public'));
app.use(express.json());

// --- Helper function to get context ---
async function getContext(bookName, injectionMode = 'global') {
    const bookPath = path.join(booksDir, bookName);
    let context = {
        world: {},
        characters: [],
        story: ''
    };

    try {
        // For now, only 'global' is implemented.
        if (injectionMode === 'global') {
            // Get world lore
            const lorePath = path.join(bookPath, 'world', 'lore.json');
            const loreData = await fs.readFile(lorePath, 'utf-8');
            context.world = JSON.parse(loreData || '{}');

            // Get all characters
            const charactersPath = path.join(bookPath, 'characters');
            const charFiles = (await fs.readdir(charactersPath)).filter(f => f.endsWith('.json'));
            context.characters = await Promise.all(charFiles.map(async file => {
                const charData = await fs.readFile(path.join(charactersPath, file), 'utf-8');
                return JSON.parse(charData);
            }));

            // Get recent story
            const storyPath = path.join(bookPath, 'story');
            const storyFiles = (await fs.readdir(storyPath)).filter(f => f.endsWith('.md')).sort();
            const recentFiles = storyFiles.slice(-3); // Get last 3 pages
            const storyContent = await Promise.all(recentFiles.map(file => {
                return fs.readFile(path.join(storyPath, file), 'utf-8');
            }));
            context.story = storyContent.join('\n\n...\n\n');
        }
        return context;
    } catch (error) {
        console.error("Error getting context:", error);
        return context; // Return empty context on error
    }
}


// --- Book & World API ---
app.get('/api/book/:bookName/world', async (req, res) => {
    const { bookName } = req.params;
    const lorePath = path.join(booksDir, bookName, 'world', 'lore.json');
    const timelinePath = path.join(booksDir, bookName, 'world', 'timeline.json');
    try {
        const loreData = await fs.readFile(lorePath, 'utf-8');
        const timelineData = await fs.readFile(timelinePath, 'utf-8');
        res.json({
            lore: JSON.parse(loreData || '{}'),
            timeline: JSON.parse(timelineData || '{}')
        });
    } catch (error) {
        console.error('Error reading world data:', error);
        res.status(500).json({ message: 'Error retrieving world data.' });
    }
});

app.post('/api/book/:bookName/world', async (req, res) => {
    const { bookName } = req.params;
    const { lore, timeline } = req.body;
    const lorePath = path.join(booksDir, bookName, 'world', 'lore.json');
    const timelinePath = path.join(booksDir, bookName, 'world', 'timeline.json');
    try {
        await fs.writeFile(lorePath, JSON.stringify(lore, null, 2));
        if (timeline) {
            await fs.writeFile(timelinePath, JSON.stringify(timeline, null, 2));
        }
        res.json({ message: 'World data saved successfully.' });
    } catch (error) {
        console.error('Error saving world data:', error);
        res.status(500).json({ message: 'Error saving world data.' });
    }
});


// --- Character API ---
app.get('/api/book/:bookName/characters', async (req, res) => {
    const { bookName } = req.params;
    const charactersPath = path.join(booksDir, bookName, 'characters');
    try {
        const files = await fs.readdir(charactersPath);
        const characterFiles = files.filter(file => file.endsWith('.json'));
        const characters = await Promise.all(characterFiles.map(async (file) => {
            const filePath = path.join(charactersPath, file);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }));
        res.json(characters);
    } catch (error) {
        res.json([]); // Return empty array if directory doesn't exist
    }
});

app.post('/api/book/:bookName/character/:charName', async (req, res) => {
    const { bookName, charName } = req.params;
    const charDir = path.join(booksDir, bookName, 'characters');
    const charPath = path.join(charDir, `${charName}.json`);
    try {
        await fs.mkdir(charDir, { recursive: true });
        await fs.writeFile(charPath, JSON.stringify(req.body, null, 2));
        res.json({ message: 'Character saved successfully.' });
    } catch (error) {
        console.error('Error saving character:', error);
        res.status(500).json({ message: 'Error saving character.' });
    }
});

app.delete('/api/book/:bookName/character/:charName', async (req, res) => {
    const { bookName, charName } = req.params;
    const charPath = path.join(booksDir, bookName, 'characters', `${charName}.json`);
    try {
        await fs.unlink(charPath);
        res.json({ message: 'Character deleted successfully.' });
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Error deleting character:', error);
            res.status(500).json({ message: 'Error deleting character.' });
        }
    }
});

// --- Story API ---
app.get('/api/book/:bookName/story', async (req, res) => {
    const { bookName } = req.params;
    const storyPath = path.join(booksDir, bookName, 'story');
    try {
        const files = await fs.readdir(storyPath);
        const storyFiles = files.filter(f => f.endsWith('.md')).sort();
        const storyContent = await Promise.all(storyFiles.map(file => {
            return fs.readFile(path.join(storyPath, file), 'utf-8');
        }));
        res.json({ story: storyContent.join('\n\n') });
    } catch (error) {
        res.json({ story: '' });
    }
});

app.post('/api/book/:bookName/generate', async (req, res) => {
    const { bookName } = req.params;
    const { prompt, injectionMode } = req.body;
    const storyPath = path.join(booksDir, bookName, 'story');

    try {
        // 1. Get Context
        const context = await getContext(bookName, injectionMode);

        // 2. Construct System Prompt
        const systemPrompt = `
You are a master storyteller continuing a narrative.
Here is the world context:
${JSON.stringify(context.world, null, 2)}

Here are the characters involved:
${context.characters.map(c => JSON.stringify(c, null, 2)).join('\n')}

Here is the most recent part of the story:
---
${context.story}
---
Your task is to continue the story based on the user's prompt. Be creative and consistent with the established world and characters.
`;

        // 3. Call AI
        const generatedText = await generateText(systemPrompt, prompt);

        // 4. Save new page
        await fs.mkdir(storyPath, { recursive: true });
        const files = await fs.readdir(storyPath);
        const lastPage = files.filter(f => f.endsWith('.md')).length;
        const newPageNum = lastPage + 1;
        const newFileName = `ch1-p${String(newPageNum).padStart(2, '0')}.md`;
        const newFilePath = path.join(storyPath, newFileName);

        await fs.writeFile(newFilePath, generatedText);
        res.json({ newContent: generatedText });

    } catch (error) {
        console.error('Error generating story page:', error);
        res.status(500).json({ message: 'Error generating story page.' });
    }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
