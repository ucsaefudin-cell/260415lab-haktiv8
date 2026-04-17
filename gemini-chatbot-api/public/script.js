// script.js

// Get DOM elements
const chatbotWidget = document.getElementById('chatbot-widget');
const chatbotHeader = document.getElementById('chatbot-header');
const closeChatbot = document.getElementById('close-chatbot');
const chatbotBody = document.getElementById('chatbot-body');
const sessionsList = document.getElementById('sessions-list');
const newSessionBtn = document.getElementById('new-session');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Initialize current conversation
let currentConversation = [];
let currentSessionId = null;

// Load sessions from localStorage
function loadSessions() {
    const sessions = JSON.parse(localStorage.getItem('chatSessions')) || [];
    return sessions;
}

// Save sessions to localStorage
function saveSessions(sessions) {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
}

// Render sessions list
function renderSessions() {
    const sessions = loadSessions();
    sessionsList.innerHTML = '';
    sessions.forEach(session => {
        const div = document.createElement('div');
        div.className = 'session-item';
        div.textContent = session.name;
        div.onclick = () => loadSession(session.id);
        sessionsList.appendChild(div);
    });
}

// Create new session
function createNewSession() {
    const sessions = loadSessions();
    const sessionId = Date.now().toString();
    const sessionName = `Chat ${sessions.length + 1}`;
    const newSession = { id: sessionId, name: sessionName, conversation: [] };
    sessions.push(newSession);
    saveSessions(sessions);
    loadSession(sessionId);
    renderSessions();
}

// Load a session
function loadSession(sessionId) {
    const sessions = loadSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
        currentSessionId = sessionId;
        currentConversation = session.conversation;
        renderChat();
    }
}

// Save current conversation
function saveCurrentConversation() {
    if (currentSessionId) {
        const sessions = loadSessions();
        const session = sessions.find(s => s.id === currentSessionId);
        if (session) {
            session.conversation = currentConversation;
            saveSessions(sessions);
        }
    }
}

// Render chat messages
function renderChat() {
    chatBox.innerHTML = '';
    currentConversation.forEach(msg => {
        addMessage(msg.role, msg.text);
    });
}

// Function to add a message to the chat box
function addMessage(role, text, isTemporary = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (role === 'model') {
        messageDiv.innerHTML = marked.parse(text);
    } else {
        messageDiv.textContent = text;
    }
    if (isTemporary) {
        messageDiv.id = 'temp-message';
    }
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
}

// Function to replace the temporary message
function replaceTempMessage(text) {
    const tempMessage = document.getElementById('temp-message');
    if (tempMessage) {
        tempMessage.innerHTML = marked.parse(text);
        tempMessage.removeAttribute('id');
    }
}

// Function to handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    const userMessage = userInput.value.trim();
    if (!userMessage) return;
    
    // Add user message to conversation and chat box
    currentConversation.push({ role: 'user', text: userMessage });
    addMessage('user', userMessage);
    
    // Clear input
    userInput.value = '';
    
    // Add temporary "Thinking..." message
    addMessage('model', 'Thinking...', true);
    
    try {
        // Send POST request to /api/chat
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conversation: currentConversation }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result) {
            // Add AI response to conversation and replace temp message
            currentConversation.push({ role: 'model', text: data.result });
            replaceTempMessage(data.result);
        } else {
            replaceTempMessage('Sorry, no response received.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to get response from server. Please try again.');
        // Remove temp message
        const tempMessage = document.getElementById('temp-message');
        if (tempMessage) {
            tempMessage.remove();
        }
    }
    
    // Save conversation
    saveCurrentConversation();
}

// Toggle chatbot visibility
function toggleChatbot() {
    if (chatbotBody.style.display === 'none') {
        chatbotBody.style.display = 'block';
    } else {
        chatbotBody.style.display = 'none';
    }
}

// Event listeners
chatbotHeader.addEventListener('click', toggleChatbot);
closeChatbot.addEventListener('click', () => {
    chatbotBody.style.display = 'none';
});
newSessionBtn.addEventListener('click', createNewSession);
chatForm.addEventListener('submit', handleSubmit);

// Initialize
renderSessions();
if (loadSessions().length === 0) {
    createNewSession();
} else {
    // Load the last session or first one
    const sessions = loadSessions();
    loadSession(sessions[sessions.length - 1].id);
}