/**
 * support.js — AI support chat via /api/chat (non-streaming JSON path),
 * /api/chat/history, /api/chat/history (DELETE), /api/chat/contact-info.
 * Every reply shown is exactly what the backend's Gemini-backed assistant
 * returned — no fake/local chatbot logic here.
 */

function bubble(role, content) {
  const div = document.createElement('div');
  div.className = `chat-bubble chat-bubble--${role === 'user' ? 'user' : 'assistant'}`;
  div.textContent = content;
  return div;
}

function scrollToBottom() {
  const box = document.getElementById('chatMessages');
  box.scrollTop = box.scrollHeight;
}

async function loadHistory() {
  try {
    const res = await Api.chat.history();
    const rows = res.data || [];
    if (rows.length) {
      const box = document.getElementById('chatMessages');
      box.innerHTML = '';
      rows.forEach(m => box.appendChild(bubble(m.role, m.content)));
      scrollToBottom();
    }
  } catch { /* fine to start with just the greeting */ }

}

async function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  const box = document.getElementById('chatMessages');
  box.appendChild(bubble('user', message));
  input.value = '';
  scrollToBottom();

  const typingEl = bubble('assistant', 'Typing…');
  typingEl.style.opacity = '0.6';
  box.appendChild(typingEl);
  scrollToBottom();

  const btn = document.getElementById('chatSendBtn');
  Utils.setButtonLoading(btn, true, '');
  try {
    const res = await Api.chat.send({ message });
    typingEl.textContent = res.reply;
    typingEl.style.opacity = '';
  } catch (err) {
    typingEl.textContent = err.message || "Sorry, I couldn't respond right now. Please try again.";
    typingEl.style.opacity = '';
  } finally {
    Utils.setButtonLoading(btn, false);
    scrollToBottom();
  }
}

document.getElementById('clearChatBtn')?.addEventListener('click', async () => {
  if (!confirm('Clear your entire chat history? This cannot be undone.')) return;
  try {
    await Api.chat.clearHistory();
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('chatMessages').appendChild(
      bubble('assistant', "Chat history cleared. How can I help you today?")
    );
    Utils.toast('Chat history cleared', 'success');
  } catch (err) {
    Utils.toast(err.message, 'error');
  }
});

Auth.guard(async () => {
  document.getElementById('chatForm').addEventListener('submit', sendMessage);
  await loadHistory();
});
