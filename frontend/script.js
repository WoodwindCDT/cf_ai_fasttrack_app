const WORKER_API_URL = "http://127.0.0.1:8787";

const chatLog = document.getElementById('chat-log');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

function addMessage(sender, message) {

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    
    const safeMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${safeMessage}`;

    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

async function handleIngest() {
    const ingestText = document.getElementById('ingest-text').value;
    const statusP = document.getElementById('ingest-status');
    statusP.textContent = "Ingesting... please wait.";
    
    try {
        const response = await fetch(`${WORKER_API_URL}/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: ingestText, source: 'frontend_test' })
        });

        const textResponse = await response.text();
        
        if (response.ok) {
            statusP.textContent = `Success: ${textResponse}`;
            document.getElementById('ingest-text').value = '';
        } else {
            statusP.textContent = `Error: ${textResponse}`;
        }
    } catch (error) {
        statusP.textContent = `Network Error: ${error.message}`;
    }
}

async function handleChat() {

    const query = userInput.value.trim();

    if (!query) return;

    addMessage('User', query);
    userInput.value = '';
    sendButton.disabled = true;

    const aiMessagePlaceholder = document.createElement('div');
    aiMessagePlaceholder.classList.add('message', 'AI');
    aiMessagePlaceholder.innerHTML = '<strong>AI:</strong> Typing...';
    chatLog.appendChild(aiMessagePlaceholder);
    chatLog.scrollTop = chatLog.scrollHeight;

    try {
        const response = await fetch(`${WORKER_API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });

        const aiResponseText = await response.text();

        aiMessagePlaceholder.innerHTML = `<strong>AI:</strong> ${aiResponseText}`;

    } catch (error) {
        aiMessagePlaceholder.innerHTML = `<strong>AI:</strong> Sorry, an error occurred: ${error.message}`;
    } finally {
        sendButton.disabled = false;
        chatLog.scrollTop = chatLog.scrollHeight;
    }
}

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleChat();
    }
});