
import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { CloseIcon, SendIcon, SpinnerIcon } from './icons/Icons';
import apiService from '../src/services/api';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && history.length === 0) {
      setHistory([{ role: 'model', content: "Bonjour ! Je suis l'assistant d'Agria Rouen. Comment puis-je vous aider aujourd'hui ?" }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isThinking) return;

    const userMessage: ChatMessage = { role: 'user', content: userInput };
    setHistory(prev => [...prev, userMessage]);
    setUserInput('');
    setIsThinking(true);

    const systemInstruction = `Tu es un assistant virtuel amical et serviable pour le restaurant Agria Rouen. Ton but est de répondre aux questions des utilisateurs en te basant sur les informations fournies dans ce contexte. Sois concis et poli. Si une question sort de ce cadre, réponds poliment que tu ne peux pas aider sur ce sujet spécifique et redirige vers les informations du restaurant.

        Informations sur le restaurant Agria Rouen :
        - Nom : Restaurant Agria Rouen
        - Spécialité : Cuisine traditionnelle française et plats du terroir normand
        - Adresse : 76100 Rouen, Normandie
        - Ambiance : Restaurant familial et convivial
        - Services : Déjeuner, dîner, événements privés, traiteur
        - Particularités : Produits frais locaux, menu saisonnier, cave à vins sélectionnée

        Réponds toujours en français et reste dans le contexte du restaurant.`;

    try {
      const resp = await apiService.post('/gemini/chat', {
        message: userMessage.content,
        history,
        systemInstruction,
        model: 'gemini-2.5-flash',
      });
      const modelMessage: ChatMessage = { role: 'model', content: resp.text || "Je n'ai pas pu générer de réponse cette fois-ci." };
      setHistory(prev => [...prev, modelMessage]);
    } catch (error: any) {
      console.error('Error sending message via proxy:', error);
      const errText = (error && (error.message || (error.data && (error.data.error || error.data.message)))) || "Désolé, une erreur s'est produite. Veuillez réessayer.";
      const errorMessage: ChatMessage = { role: 'model', content: String(errText) };
      setHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg h-[80vh] max-h-[700px] flex flex-col transform transition-all duration-300 scale-100">
        <header className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <h3 className="text-xl font-serif font-bold text-gray-800">Assistant Agria</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon />
          </button>
        </header>

        <div ref={chatMessagesRef} className="flex-1 p-4 overflow-y-auto space-y-4">
          {history.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-2xl p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-agria-green text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex items-end gap-2 justify-start">
              <div className="rounded-2xl p-3 bg-gray-200 text-gray-800 rounded-bl-none">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <footer className="p-4 border-t bg-gray-50 rounded-b-lg">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-agria-green"
              disabled={isThinking}
            />
            <button type="submit" className="bg-agria-green text-white p-3 rounded-full hover:bg-agria-green-dark disabled:bg-agria-green/50" disabled={!userInput.trim() || isThinking}>
              {isThinking ? <SpinnerIcon /> : <SendIcon />}
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default Chatbot;