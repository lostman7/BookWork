document.addEventListener('DOMContentLoaded', () => {
    const currentBook = 'MyFirstBook';
    let characters = [];
    let selectedCharName = null;

    // --- Element References ---
    const worldSidebar = document.getElementById('world-sidebar');
    const characterSidebar = document.getElementById('character-sidebar');
    const modeSwitch = document.getElementById('mode-switch');
    const saveLinkBtn = document.getElementById('save-link-btn');

    const worldForm = {
        where: document.getElementById('where'),
        when: document.getElementById('when'),
        what: document.getElementById('what'),
        tone: document.getElementById('tone'),
        rules: document.getElementById('rules')
    };
    const storyDisplay = document.querySelector('.story-display');
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-btn');
    const charList = document.querySelector('.character-list');
    const charForm = document.getElementById('char-form');
    const charFormTitle = document.getElementById('char-form-title');
    const charSubmitBtn = document.getElementById('char-submit-btn');
    const newCharBtn = document.getElementById('char-new-btn');
    const memoryToggle = document.getElementById('memory-toggle');

    // --- API Functions ---
    async function loadWorld() {
        try {
            const response = await fetch(`/api/book/${currentBook}/world`);
            const data = await response.json();
            const worldData = data.lore;
            for (const key in worldForm) {
                if (worldData[key]) {
                    worldForm[key].value = worldData[key];
                }
            }
        } catch (error) {
            console.error('Failed to load world data:', error);
        }
    }

    async function saveWorld() {
        const worldData = {};
        for (const key in worldForm) {
            worldData[key] = worldForm[key].value;
        }
        try {
            await fetch(`/api/book/${currentBook}/world`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lore: worldData })
            });
        } catch (error) {
            console.error('Failed to save world data:', error);
        }
    }

    async function loadCharacters() {
        try {
            const response = await fetch(`/api/book/${currentBook}/characters`);
            characters = await response.json();
            renderCharacters();
        } catch (error) {
            console.error('Failed to load characters:', error);
        }
    }

    async function loadStory() {
        try {
            const response = await fetch(`/api/book/${currentBook}/story`);
            const data = await response.json();
            if (data.story) {
                storyDisplay.textContent = data.story;
            } else {
                storyDisplay.textContent = 'Your story begins here...';
            }
        } catch (error) {
            console.error('Failed to load story:', error);
        }
    }

    // --- Render Functions ---
    function renderCharacters() {
        charList.innerHTML = '';
        characters.forEach(char => {
            const li = document.createElement('li');
            li.className = 'character-item';
            li.dataset.name = char.name;
            if (char.name === selectedCharName) {
                li.classList.add('selected');
            }
            li.innerHTML = `<span>${char.name}</span><button class="delete-btn" data-name="${char.name}">X</button>`;
            charList.appendChild(li);
        });
    }

    // --- UI/Mode Functions ---
    function setMode(mode) {
        if (mode === 'planning') {
            worldSidebar.style.display = 'block';
            characterSidebar.style.display = 'block';
        } else { // 'writing'
            worldSidebar.style.display = 'none';
            characterSidebar.style.display = 'none';
        }
    }

    function resetCharForm() {
        charForm.reset();
        selectedCharName = null;
        charForm.elements.name.disabled = false;
        charFormTitle.textContent = 'Add Character';
        charSubmitBtn.textContent = 'Create';
        newCharBtn.style.display = 'none';
        renderCharacters();
    }

    // --- Initial Load ---
    loadWorld();
    loadCharacters();
    loadStory();
    setMode('writing'); // Default to writing mode

    // --- Event Listeners ---
    modeSwitch.addEventListener('change', (e) => {
        setMode(e.target.value);
    });

    saveLinkBtn.addEventListener('click', () => {
        alert('Feature not implemented yet. This would open a dialog to let you highlight text from the story and save it as a new character trait or world detail.');
        console.log("'Save & Link' button clicked. A real implementation would parse the story content and allow updating memory files.");
    });

    Object.values(worldForm).forEach(input => {
        input.addEventListener('change', saveWorld);
    });

    charForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(charForm);
        const charData = Object.fromEntries(formData.entries());
        const charName = charData.name;

        try {
            await fetch(`/api/book/${currentBook}/character/${charName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(charData)
            });
            await loadCharacters();
            resetCharForm();
        } catch (error) {
            console.error('Failed to save character:', error);
        }
    });

    charList.addEventListener('click', async (e) => {
        const target = e.target;
        const li = target.closest('.character-item');
        if (!li) return;
        const charName = li.dataset.name;

        if (target.classList.contains('delete-btn')) {
            if (confirm(`Are you sure you want to delete ${charName}?`)) {
                try {
                    await fetch(`/api/book/${currentBook}/character/${charName}`, { method: 'DELETE' });
                    if (selectedCharName === charName) resetCharForm();
                    await loadCharacters();
                } catch (error) {
                    console.error('Failed to delete character:', error);
                }
            }
        } else {
            selectedCharName = charName;
            const char = characters.find(c => c.name === charName);
            if (char) {
                for (const key in char) {
                    if (charForm.elements[key]) charForm.elements[key].value = char[key];
                }
                charForm.elements.name.disabled = true;
                charFormTitle.textContent = 'Edit Character';
                charSubmitBtn.textContent = 'Update';
                newCharBtn.style.display = 'inline-block';
                renderCharacters();
            }
        }
    });

    newCharBtn.addEventListener('click', resetCharForm);

    generateBtn.addEventListener('click', async () => {
        const prompt = promptInput.value;
        if (!prompt) return;

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        const injectionMode = memoryToggle.checked ? 'global' : 'local';

        try {
            const response = await fetch(`/api/book/${currentBook}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, injectionMode })
            });
            const data = await response.json();

            const currentStory = storyDisplay.textContent === 'Your story begins here...' ? '' : storyDisplay.textContent;
            storyDisplay.textContent = `${currentStory}\n\n${data.newContent}`;
            promptInput.value = '';

        } catch (error) {
            console.error('Failed to generate story:', error);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate';
        }
    });
});
