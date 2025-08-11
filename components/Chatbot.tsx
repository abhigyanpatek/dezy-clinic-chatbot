'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Appointment } from '@/lib/types';
import { useAppointmentStore } from '@/lib/store';
import { DOCTORS } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: 'Hello! Welcome to Dezy Clinic. I can help you book appointments, learn about our treatments, or answer questions about our plastic surgery services. How may I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { appointments, addAppointment, cancelAppointment, updateAppointment } = useAppointmentStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          appointments: appointments
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Handle function calls
      if (data.functionCall) {
        const { name, arguments: args } = data.functionCall;
        const parsedArgs = JSON.parse(args);

        if (name === 'bookAppointment') {
          const doctor = DOCTORS.find(d => d.id === parsedArgs.doctorId);
          const newAppointment: Appointment = {
            id: uuidv4(),
            ...parsedArgs,
            doctorName: doctor?.name || '',
            status: 'confirmed',
            createdAt: new Date()
          };
          
          addAppointment(newAppointment);
          
          const confirmMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `✅ Excellent! Your appointment has been confirmed:\n\n` +
                    `**Appointment Details:**\n` +
                    `• Patient: ${parsedArgs.patientName}\n` +
                    `• Doctor: ${doctor?.name}\n` +
                    `• Date: ${parsedArgs.date}\n` +
                    `• Time: ${parsedArgs.time}\n` +
                    `• Treatment: ${parsedArgs.treatment || 'Consultation'}\n` +
                    `• Appointment ID: ${newAppointment.id.slice(0, 8)}\n\n` +
                    `We'll send a confirmation to ${parsedArgs.patientPhone}. ` +
                    `Please arrive 15 minutes early for registration. Is there anything else I can help you with?`,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, confirmMessage]);
        } else if (name === 'rescheduleAppointment') {
          const { appointmentId, date, time } = parsedArgs;
          updateAppointment(appointmentId, {
            date,
            time
          });

          const reschedMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `✅ Your appointment has been rescheduled to ${date} at ${time}. Is there anything else I can assist you with?`,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, reschedMessage]);

        } else if (name === 'cancelAppointment') {
          cancelAppointment(parsedArgs.appointmentId);
          
          const cancelMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `Your appointment has been cancelled successfully. ` +
                    `Would you like to schedule a new appointment?`,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, cancelMessage]);
        } else if (data.content) {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            role: 'assistant',
            content: data.content,
            timestamp: new Date()
          }]);
        }
      } else if (data.content) {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact our clinic directly at (555) 123-4567.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-semibold">Dezy Clinic Assistant</h2>
            <p className="text-sm opacity-90">AI-Powered Appointment Booking</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`flex space-x-2 max-w-[80%] ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      ul: (props) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                      ol: (props) => <ol className="list-decimal pl-5 space-y-1" {...props} />,
                      li: (props) => <li className="mb-0.5" {...props} />,
                      p: (props) => <p className="mb-1" {...props} />,
                      strong: (props) => <span className="font-semibold" {...props} />,
                      em: (props) => <span className="italic" {...props} />,
                      a: (props) => <a className="text-blue-600 underline" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-line">{message.content}</p>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot size={18} className="text-gray-600" />
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickAction('I want to book an appointment')}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            Book Appointment
          </button>
          <button
            onClick={() => handleQuickAction('What treatments do you offer?')}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            Our Treatments
          </button>
          <button
            onClick={() => handleQuickAction('Tell me about the doctors')}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            Our Doctors
          </button>
          <button
            onClick={() => handleQuickAction('What should I do before my surgery?')}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            Pre-op Care
          </button>
          <button
            onClick={() => handleQuickAction('What post-operative care is recommended?')}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            Post-op Care
          </button>
          <button
            onClick={() => handleQuickAction('Check my appointments')}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            My Appointments
          </button>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}