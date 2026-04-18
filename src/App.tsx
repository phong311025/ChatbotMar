/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="vite/client" />

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageSquare, 
  Info, 
  GraduationCap,
  Plus,
  History,
  Paperclip,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './lib/utils';

// --- KNOWLEDGE BASE ---
const KNOWLEDGE_BASE = `
Bạn là "AI Tư vấn Tuyển sinh Học viện Tài chính 2026" (AOF Smart Advisor).
Nhiệm vụ của bạn là giải đáp chính xác các thông tin tuyển sinh dựa trên dữ liệu sau:

1. THÔNG TIN CHUNG:
- Tên trường: Học viện Tài chính (Academy of Finance - AOF).
- Mã trường: HTC (Hà Nội), HTS (Phân hiệu Miền Nam).
- Địa chỉ: 58 Lê Văn Hiến, Phường Đức Thắng, Quận Bắc Từ Liêm, Hà Nội.
- Hotline Hà Nội: 0961.481.086 | 0967.684.086.
- Hotline Miền Nam: 0983.069.688 | 0961.767.688.
- Tổng chỉ tiêu: 4.200 (Chương trình chuẩn: 3.000, Chương trình quốc tế/DDP: 1.200).
- Lệ phí xét tuyển: 100.000 VNĐ/hồ sơ.

2. PHƯƠNG THỨC XÉT TUYỂN 2026:
- Phương thức 1 (PT1): Tuyển thẳng Bộ GD&ĐT và xét tuyển riêng (Học sinh chuyên, giải Quốc gia/Quốc tế).
- Phương thức 2 (PT2): Xét tuyển kết hợp (Dành cho HS đạt loại Tốt/Giỏi). Chia 3 Nhóm:
    + Nhóm 1: HSG 3 năm + Chứng chỉ (IELTS >= 7.0 / SAT >= 1450 / ACT >= 31) HOẶC Giải HSG Quốc gia.
    + Nhóm 2: HSG 3 năm + Chứng chỉ (IELTS 5.5-6.5 / SAT 1050-1440 / ACT 22-30) HOẶC Giải HSG cấp Tỉnh (Nhất, Nhì, Ba).
    + Nhóm 3: HSG 3 năm nhưng không có chứng chỉ/giải thưởng.
- Phương thức 3 (PT3): Dựa trên kết quả thi tốt nghiệp THPT năm 2026.

3. BẢNG QUY ĐỔI ĐIỂM (Thang 10) áp dụng cho môn 3 (PT2) và thay thế Tiếng Anh (PT3):
- IELTS: 7.5+ (10.0), 7.0 (9.75), 6.5 (9.5), 6.0 (9.25), 5.5 (9.0).
- SAT: 1500+ (10.0), 1400-1490 (9.75), 1300-1390 (9.5), 1200-1290 (9.25), 1050-1190 (9.0).
- ACT: 33+ (10.0), 31-32 (9.75), 29-30 (9.5), 27-28 (9.25), 22-26 (9.0).
- Giải HSG Cấp Tỉnh: Nhất (10.0), Nhì (9.5), Ba (9.0).

4. CÔNG THỨC TÍNH ĐIỂM (ĐXT):
- Nhóm 1 & 2: ĐXT = Điểm môn 1 (Toán) + Điểm môn 2 (TBC học bạ tổ hợp cao nhất) + Điểm quy đổi (Môn 3) + Ưu tiên.
- Nhóm 3: ĐXT = Điểm môn 1 (Toán THPT) + Điểm môn 2 (TBC học bạ) + Điểm môn 3 (Điểm thi THPT cao nhất còn lại) + Ưu tiên.
- Điểm sàn: 19.0 (Chuẩn), 20.0 (DDP).

5. ĐIỀU KIỆN QUAN TRỌNG:
- Hạnh kiểm: Bắt buộc TỐT 3 năm THPT.
- Học lực: Loại TỐT (Khóa 2025-2026) hoặc GIỎI (Trước 2025).
- Thời hạn chứng chỉ: Cấp từ 01/06/2024.

HƯỚNG DẪN TRẢ LỜI:
- Xưng hô "AOF Bot" và "Bạn" hoặc "Em".
- Nếu thí sinh đưa số điểm/chứng chỉ, hãy chủ động tính điểm quy đổi.
- Trình bày dạng Markdown dễ đọc.
`;

const INITIAL_MESSAGE = "Chào mừng bạn đến với hệ thống hỗ trợ tuyển sinh Học viện Tài chính 2026. Tôi có thể giúp bạn tìm hiểu về ngành học, chỉ tiêu, hoặc các phương thức xét tuyển mới nhất.";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>([
    { 
      id: 'initial', 
      title: 'Tư vấn mới', 
      messages: [{ role: 'assistant', content: INITIAL_MESSAGE }],
      timestamp: new Date()
    }
  ]);
  const [activeChatId, setActiveChatId] = useState<string>('initial');
  
  const currentChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = currentChat.messages;

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [attachedFile, setAttachedFile] = useState<{ name: string, content: string, type: string } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  const aiRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenAI({ apiKey });
      aiRef.current = genAI;
    } else {
      console.warn("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your env variables.");
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newChat: Chat = {
      id: newId,
      title: 'Tư vấn mới',
      messages: [{ role: 'assistant', content: INITIAL_MESSAGE }],
      timestamp: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const parseFile = async (file: File) => {
    setIsParsing(true);
    try {
      let content = '';
      const arrayBuffer = await file.arrayBuffer();

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        content = fullText;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        content = XLSX.utils.sheet_to_txt(worksheet);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        content = await file.text();
      }

      setAttachedFile({ name: file.name, content, type: file.type });
    } catch (err) {
      console.error("File parsing error:", err);
      alert("Không thể đọc tệp này. Vui lòng thử lại với định dạng khác.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    let userContent = input;
    if (attachedFile) {
      userContent = `[Tệp đính kèm: ${attachedFile.name}]\n\nNội dung tệp:\n${attachedFile.content}\n\nCâu hỏi: ${input || "Hãy tóm tắt nội dung tệp này"}`;
    }

    const userMessage: Message = { role: 'user', content: userContent };
    const displayMessage: Message = { 
      role: 'user', 
      content: attachedFile ? `📎 Đã đính kèm tệp: ${attachedFile.name}${input ? `\n\n${input}` : ''}` : input 
    };
    
    if (!aiRef.current) {
      alert("Hệ thống AI chưa được kết nối. Vui lòng thêm VITE_GEMINI_API_KEY vào biến môi trường (Environment Variables) trên Vercel của bạn và deploy lại.");
      return;
    }

    const updatedMessages = [...messages, userMessage];
    const displayUpdatedMessages = [...messages, displayMessage];
    
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        const isFirstUserMessage = chat.messages.filter(m => m.role === 'user').length === 0;
        return {
          ...chat,
          messages: displayUpdatedMessages,
          title: isFirstUserMessage ? (input.length > 25 ? input.substring(0, 25) + '...' : (attachedFile ? attachedFile.name : 'Cuộc trò chuyện mới')) : chat.title
        };
      }
      return chat;
    }));

    setInput('');
    setAttachedFile(null);
    setIsLoading(true);

    const assistantMessageIndex = displayUpdatedMessages.length;
    let fullContent = "";

    // Sync assistant placeholder BEFORE calling API to show "thinking" immediately
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, { role: 'assistant', content: "" }]
        };
      }
      return chat;
    }));

    try {
      const chatContents = updatedMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const stream = await aiRef.current.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: chatContents,
        config: {
          systemInstruction: KNOWLEDGE_BASE,
        }
      });

      let firstChunk = true;
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          if (firstChunk) {
            setIsLoading(false);
            firstChunk = false;
          }
          fullContent += chunkText;
          setChats(prev => prev.map(chat => {
            if (chat.id === activeChatId) {
              const newMessages = [...chat.messages];
              newMessages[assistantMessageIndex] = { 
                ...newMessages[assistantMessageIndex], 
                content: fullContent 
              };
              return { ...chat, messages: newMessages };
            }
            return chat;
          }));
        }
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          const newMessages = [...chat.messages];
          if (fullContent === "") {
            newMessages[assistantMessageIndex] = { 
              role: 'assistant', 
              content: "Xin lỗi, mình gặp một chút trục trặc hệ thống. Bạn có thể thử lại sau nhé!" 
            };
          }
          return { ...chat, messages: newMessages };
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f9fafb] text-[#1f2937] overflow-hidden font-sans">
      <aside className="hidden lg:flex w-[280px] bg-white border-r border-[#e5e7eb] flex-col p-6 shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#004a99] rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">
            F
          </div>
          <div className="flex flex-col">
            <h1 className="text-[15px] font-bold text-[#004a99] uppercase leading-tight">Học viện Tài chính</h1>
            <p className="text-[11px] text-[#6b7280]">Tuyển sinh 2026</p>
          </div>
        </div>

        <button 
          onClick={handleNewChat}
          className="flex items-center gap-2 w-full px-4 py-3 bg-[#004a99] text-white rounded-xl font-semibold text-sm shadow-md hover:bg-blue-800 transition-all mb-8 group active:scale-[0.98]"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          Cuộc trò chuyện mới
        </button>

        <div className="flex-1 overflow-y-auto no-scrollbar -mx-2 px-2">
          <div className="flex items-center gap-2 mb-4 px-2">
            <History size={14} className="text-[#6b7280]" />
            <p className="text-[11px] uppercase tracking-wider text-[#6b7280] font-bold">Lịch sử đoạn chat</p>
          </div>
          
          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-3 border transition-all",
                  activeChatId === chat.id 
                    ? "bg-[#eff6ff] text-[#004a99] border-blue-100" 
                    : "text-[#4b5563] border-transparent hover:bg-gray-50"
                )}
              >
                <MessageSquare size={14} className={cn("shrink-0", activeChatId === chat.id ? "text-[#004a99]" : "text-gray-400")} />
                <span className="truncate">{chat.title}</span>
              </button>
            ))}
            
            {chats.length === 0 && (
              <div className="px-3 py-10 flex flex-col items-center justify-center gap-2 opacity-50 border border-dashed border-gray-200 rounded-xl mt-4">
                 <Bot size={24} className="text-gray-400" />
                 <p className="text-[11px] text-center text-gray-500">Chưa có lịch sử trò chuyện</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-[72px] bg-white border-b border-[#e5e7eb] px-8 flex items-center justify-between shrink-0">
          <h2 className="text-[18px] font-bold text-[#1f2937]">Trợ lý ảo AOF SmartBot</h2>
          <div className="flex items-center gap-2 text-[13px] text-[#6b7280]">
            <div className="w-2 h-2 bg-[#10b981] rounded-full" />
            Hệ thống đang sẵn sàng
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-8 space-y-6 scroll-smooth no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col gap-1",
                  m.role === 'user' ? "items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "max-w-[85%] lg:max-w-[75%] p-4 lg:p-5 text-[14px] leading-relaxed relative",
                  m.role === 'assistant' 
                    ? "bg-white border border-[#e5e7eb] text-[#1f2937] rounded-[18px] rounded-tl-none bubble-shadow" 
                    : "bg-[#004a99] text-white rounded-[18px] rounded-tr-none shadow-lg shadow-blue-900/10"
                )}>
                  {m.role === 'assistant' ? (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
                <span className="text-[11px] text-[#6b7280]">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {m.role === 'user' ? 'Bạn' : 'Hệ thống'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex items-start"
            >
              <div className="bg-white border border-[#e5e7eb] p-4 rounded-[18px] rounded-tl-none bubble-shadow flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#004a99] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#004a99] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#004a99] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[13px] text-[#6b7280] font-medium">AOF AI đang chuẩn bị phản hồi...</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="bg-white border-t border-[#e5e7eb] p-8 shrink-0">
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence>
              {attachedFile && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-2.5 rounded-xl inline-flex max-w-full"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[12px] font-bold text-[#004a99] truncate">{attachedFile.name}</p>
                    <p className="text-[10px] text-blue-400 uppercase font-bold">Đã sẵn sàng tải lên</p>
                  </div>
                  <button 
                    onClick={() => setAttachedFile(null)}
                    className="p-1 hover:bg-blue-200 rounded-full text-blue-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {["Hồ sơ nhập học gồm những gì?", "Học phí ngành Tài chính", "Ký túc xá cho tân sinh viên"].map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => setInput(q)}
                  className="text-[12px] bg-white border border-[#e5e7eb] px-3.5 py-1.5 rounded-full whitespace-nowrap text-[#004a99] hover:bg-blue-50 transition-all font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.xlsx,.txt"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isParsing}
                className="w-[42px] h-[42px] bg-white border border-[#e5e7eb] text-[#6b7280] rounded-full flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-all shrink-0 shadow-sm active:scale-90"
                title="Tải lên tệp (PDF, Word, Excel)"
              >
                {isParsing ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
              </button>
              <div className="flex-1 relative flex items-center group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={attachedFile ? "Đặt câu hỏi về tệp đã chọn..." : "Nhập câu hỏi hoặc tải lên tệp..."}
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] px-5 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#004a99]/10 focus:border-[#004a99] transition-all text-sm"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !attachedFile) || isLoading || isParsing}
                className="w-[42px] h-[42px] bg-[#004a99] text-white rounded-full flex items-center justify-center hover:bg-blue-800 disabled:bg-gray-200 transition-all shrink-0 shadow-md active:scale-90"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
