/* Chatbot Logic */
(function() {
    // Create Chatbot HTML Structure
    const chatbotHTML = `
        <div class="chatbot-container">
            <div class="chatbot-button" id="chatbotBtn">
                <svg viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
            </div>
            <div class="chatbot-window" id="chatbotWindow">
                <div class="chatbot-header">
                    <h3>Sportify Helper</h3>
                    <span class="close-chat" id="closeChat">&times;</span>
                </div>
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="message bot-message">
                        Hello! 👋 Welcome to Sportify Spots. How can I help you today?
                    </div>
                </div>
                <div class="typing-indicator" id="typingIndicator" style="padding: 0 20px;">Sportify is typing...</div>
                <div class="chatbot-input">
                    <input type="text" id="chatInput" placeholder="Type a message...">
                    <button class="send-btn" id="sendChat">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // Elements
    const chatbotBtn = document.getElementById('chatbotBtn');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendChat = document.getElementById('sendChat');
    const messagesContainer = document.getElementById('chatbotMessages');
    const typingIndicator = document.getElementById('typingIndicator');

    // Toggle Chatbot
    chatbotBtn.addEventListener('click', () => {
        chatbotWindow.classList.toggle('active');
    });

    closeChat.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
    });

    // Send Message Function
    function sendMessage() {
        const text = chatInput.value.trim();
        if (text === "") return;

        // User Message
        appendMessage(text, 'user');
        chatInput.value = "";

        // Bot Response
        showTyping(true);
        setTimeout(() => {
            const response = getBotResponse(text);
            showTyping(false);
            appendMessage(response, 'bot');
        }, 1000);
    }

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message');
        msgDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        msgDiv.innerText = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTyping(show) {
        typingIndicator.style.display = show ? 'block' : 'none';
    }

    function getBotResponse(input) {
        const query = input.toLowerCase();
        
        if (query.includes('hello') || query.includes('hi')) {
            return "Hi there! I'm your Sportify Spots assistant. You can ask me about ground bookings, membership, or locations.";
        }
        if (query.includes('ground') || query.includes('book')) {
            return "We have various grounds for Cricket, Football, Badminton, and more. You can check them out on our 'Grounds' page!";
        }
        if (query.includes('membership') || query.includes('pro')) {
            return "We offer PRO (10% discount) and PRO PLUS (20% discount) plans. Check the 'Membership' page for more details!";
        }
        if (query.includes('price') || query.includes('cost')) {
            return "Prices vary by ground and time slot. Generally, they range from ₹500 to ₹2000 per hour.";
        }
        if (query.includes('location') || query.includes('city')) {
            return "We have grounds in Chennai, Bangalore, Hyderabad, Mumbai, Delhi, and many other cities!";
        }
        if (query.includes('contact') || query.includes('support')) {
            return "You can reach our support team at support@sportifyspots.com or call us at +91-9876543210.";
        }
        
        return "I'm not sure I understand. Could you please rephrase? You can ask about 'grounds', 'membership', or 'pricing'.";
    }

    // Event Listeners
    sendChat.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();
