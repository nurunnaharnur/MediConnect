import { useState, useEffect, useRef } from 'react';
import { getHealthTips, getUser } from '../api/authApi';
import '../styles/FloatingChatbot.css';

const QUICK_PROMPTS = [
  '💡 My personalized health tips',
  '🥗 Advice on balanced diet & macros',
  '💊 How to improve medication adherence?',
  '🫀 How to keep normal blood pressure?',
  '🌸 Common symptoms of PCOS and management',
];

export default function FloatingHealthAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hello! I am your MediConnect AI Health Assistant 🩺. Ask me about your health tips, symptoms, nutrition guidance, or medication management!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const msgIdCounter = useRef(10);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  async function handleSend(textToSend) {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    msgIdCounter.current += 1;
    const userMsg = {
      id: msgIdCounter.current,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const q = query.toLowerCase();
      let responseText = '';

      if (q.includes('tip') || q.includes('my health') || q.includes('personalized')) {
        const tipsData = await getHealthTips().catch(() => null);
        if (tipsData && Array.isArray(tipsData.tips) && tipsData.tips.length > 0) {
          responseText = `Here are your personalized health recommendations based on your profile:\n\n` +
            tipsData.tips.map((t) => `• **${t.title || 'Tip'}**: ${t.description || t}`).join('\n\n');
        } else {
          const user = getUser();
          responseText = `Based on your profile (${user?.gender || 'Patient'}, ${user?.age || 'General'} yrs), maintain adequate hydration (2.5L daily), aim for 7-8 hours of sleep, and keep regular physical activity (30 mins walking/day).`;
        }
      } else if (q.includes('diet') || q.includes('nutrition') || q.includes('calorie') || q.includes('food')) {
        responseText = `🥗 **Nutrition & Diet Advice**:\n• Prioritize lean proteins, complex carbohydrates, and leafy greens.\n• Stay hydrated with 8–10 glasses of water daily.\n• Log your daily intake in the **Diet & Fitness** tracker (/diet-fitness) to monitor macronutrient balance.`;
      } else if (q.includes('blood pressure') || q.includes('bp') || q.includes('hypertension') || q.includes('heart')) {
        responseText = `🫀 **Cardiovascular Wellness**:\n• Ideal BP target is under **120/80 mmHg**.\n• Moderate sodium intake (< 2,300mg/day) and include potassium-rich foods (bananas, spinach).\n• Track systolic & diastolic logs and charts in the **Blood Pressure** tracker.`;
      } else if (q.includes('pcos') || q.includes('period') || q.includes('menstruat') || q.includes('cycle')) {
        responseText = `🌸 **Reproductive & Cycle Guidance**:\n• Regular sleep, stress reduction, and balanced low-glycemic diets help hormonal regulation.\n• You can evaluate risk patterns (irregular cycles, acne, hair changes) directly inside the **Menstruation & PCOS Tracker** (/cycles).`;
      } else if (q.includes('medication') || q.includes('reminder') || q.includes('pill') || q.includes('dose')) {
        responseText = `💊 **Medication Management**:\n• Always take medications with water and follow timing guidelines (before/after meals).\n• Enable email notifications and mark doses as *Taken* in the **Medicine Reminders** module (/reminders) to maintain adherence.`;
      } else if (q.includes('doctor') || q.includes('hospital') || q.includes('appointment')) {
        responseText = `👨‍⚕️ **Clinical Consultations**:\n• You can discover nearby healthcare facilities in **Find Hospitals** (/hospitals) or schedule a consultation in **Doctor Appointments** (/appointments).`;
      } else {
        responseText = `Thank you for sharing. For general wellness:\n• Stay active with regular physical exercise.\n• Maintain balanced nutrition and track your vitals regularly.\n• For specific clinical diagnosis or prescription adjustments, please schedule a consultation with your designated physician through MediConnect.`;
      }

      msgIdCounter.current += 1;
      const assistantMsg = {
        id: msgIdCounter.current,
        sender: 'assistant',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      msgIdCounter.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: msgIdCounter.current,
          sender: 'assistant',
          text: 'I encountered an issue retrieving that information. Please try again or consult your doctor.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="mc-chatbot-wrapper">
      {/* Floating Toggle Button */}
      <button
        type="button"
        className={`mc-chatbot-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        title="Open AI Health Assistant"
        aria-label="AI Health Assistant"
      >
        <span className="mc-chatbot-icon">{isOpen ? '✕' : '💬'}</span>
        {!isOpen && <span className="mc-chatbot-pulse" />}
      </button>

      {/* Slide-Up Chat Window */}
      {isOpen && (
        <div className="mc-chat-window">
          <div className="mc-chat-header">
            <div className="mc-chat-header-info">
              <span className="mc-chat-avatar">🤖</span>
              <div>
                <h4>MediConnect AI Health Assistant</h4>
                <p className="mc-chat-status">● Online • 24/7 Clinical & Wellness Support</p>
              </div>
            </div>
            <button
              type="button"
              className="mc-chat-close-btn"
              onClick={() => setIsOpen(false)}
              title="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="mc-chat-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mc-chat-bubble-wrap ${msg.sender === 'user' ? 'user' : 'assistant'}`}
              >
                <div className={`mc-chat-bubble ${msg.sender === 'user' ? 'user' : 'assistant'}`}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  <span className="mc-chat-timestamp">{msg.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="mc-chat-bubble-wrap assistant">
                <div className="mc-chat-bubble assistant typing">
                  <span className="mc-dot" />
                  <span className="mc-dot" />
                  <span className="mc-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="mc-chat-quick-prompts">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                className="mc-quick-chip"
                onClick={() => handleSend(p)}
                disabled={loading}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form
            className="mc-chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="mc-chat-input"
              placeholder="Ask about health tips, symptoms, vitals..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="submit"
              className="mc-chat-send-btn"
              disabled={loading || !input.trim()}
              title="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
