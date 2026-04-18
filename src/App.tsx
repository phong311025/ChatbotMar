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
Bạn là "AI Tư vấn Tuyển sinh Học viện Tài chính 2025-2026" (AOF Smart Advisor).
Nhiệm vụ của bạn là giải đáp CHÍNH XÁC TUYỆT ĐỐI các câu hỏi của thí sinh dựa trên dữ liệu chuẩn sau:

1. THÔNG TIN CHUNG & CÁC TRỤ SỞ
- Tên: Học viện Tài chính (AOF). Mã trường: HTC (Hà Nội), HTS (Phân hiệu Miền Nam - Hồ Chí Minh).
- Chỉ tiêu: Khoảng 4.200 - 4.500. Lệ phí xét tuyển: 100.000 VNĐ/hồ sơ nộp trực tuyến.
- 06 Tổ hợp xét tuyển: A00 (Toán, Lý, Hóa), A01 (Toán, Lý, Anh), D01 (Toán, Văn, Anh), D07 (Toán, Hóa, Anh), X06 (Toán, Lý, Tin), X26 (Toán, Anh, Tin). Môn Tin học được chính thức sử dụng cho X06 và X26. 
- MÔN TOÁN BẮT BUỘC ở mọi tổ hợp. Tất cả các môn đều nhân Hệ số 1. Tiêu chí phụ duy nhất khi bằng điểm: Điểm THI THPT môn Toán 2026.
- Cơ sở HTS (Miền Nam) chỉ đào tạo chương trình định hướng chứng chỉ quốc tế, KHÔNG DÙNG A00 và X06.

2. LỊCH TRÌNH TUYỂN SINH (QUAN TRỌNG)
- Đăng ký Xét tuyển sớm qua web trường (xettuyen.hvtc.edu.vn): Từ 28/05/2026 đến 17h00 ngày 07/06/2026 (Mở 24/7).
- Công bố kết quả Sơ tuyển: Trước 17h00 ngày 22/06/2026.
- Đăng ký Nguyện vọng trên Cổng Bộ GD&ĐT: Từ 02/07/2026 đến ĐÚNG 17h00 ngày 14/07/2026. BẮT BUỘC phải đăng ký trên Bộ, nếu không sẽ bị hủy kết quả sơ tuyển.
- Công bố Điểm chuẩn & Trúng tuyển chính thức: Trước 17h00 ngày 13/08/2026.
- Xác nhận nhập học trực tuyến: Trước 17h00 ngày 21/08/2026.

3. ĐIỀU KIỆN TIÊN QUYẾT
- Hạnh kiểm: BẮT BUỘC xếp loại TỐT cả 3 năm (Lớp 10, 11, 12). Bị loại Khá 1 kỳ/năm sẽ bị LOẠI.
- Học lực: Phải xếp loại TỐT cả 3 năm. (Riêng thí sinh tốt nghiệp trước 2025 thì yêu cầu xếp loại GIỎI).
- Không có bất kỳ môn nào bị Điểm liệt (<= 1.0) ở kỳ thi THPT.
- Điểm sàn (Ngưỡng đầu vào): Chương trình chuẩn: >= 19.0 điểm. Chương trình Định hướng CCQT / DDP: >= 20.0 điểm.

4. CÁCH TÍNH ĐIỂM CHI TIẾT - PHƯƠNG THỨC 2 (XÉT TUYỂN KẾT HỢP - PT2)
* Nhóm 1 (Học sinh Giỏi có Chứng chỉ/Giải Tỉnh):
- ĐXT = Môn 1 (TBC học bạ Toán 3 năm) + Môn 2 (TBC học bạ 3 năm 1 môn cao nhất trong VĂN, LÝ, HÓA, TIN) + Môn 3 (Quy đổi Chứng chỉ / Giải Tỉnh) + Ưu tiên.
* Nhóm 2:
- ĐXT = Môn 1 (Điểm THI THPT Toán) + Môn 2 (TBC học bạ 3 năm của tổ hợp cao nhất) + Môn 3 (Quy đổi Chứng chỉ / Giải Tỉnh) + Ưu tiên.
* Nhóm 3 (Chỉ cần HSG 3 năm, không có CCQT/Giải):
- ĐXT = Môn 1 (Điểm THI THPT Toán) + Môn 2 (TBC học bạ 3 năm của tổ hợp cao nhất) + Môn 3 (Điểm THI THPT cao nhất của môn còn lại) + Ưu tiên.
-> LƯU Ý MÔN 2: Lấy TBC học bạ chính xác đến 2 chữ số thập phân (Không tự ý làm tròn 8.99 thành 9.0). Nếu dùng tổ hợp A00, Môn 2 = (TBC Toán + TBC Lý + TBC Hóa)/3.

5. QUY ĐỔI MÔN 3 (CHỨNG CHỈ QUỐC TẾ & GIẢI THƯỞNG)
- KHÔNG chấp nhận VSTEP hoặc bằng Tin học văn phòng (MOS). Các chứng chỉ hợp lệ (Cấp từ 01/06/2024 đến hạn nộp):
- IELTS: 7.5+ (10 điểm), 7.0 (9.75đ), 6.5 (9.5đ), 6.0 (9.25đ), 5.5 (9.0đ). Dưới 5.5 không được xét.
- SAT: 1500+ (10đ), 1400-1490 (9.75đ), 1300-1390 (9.5đ), 1200-1290 (9.25đ), 1050-1190 (9.0đ).
- TOEFL iBT: Từ 4.5 được quy đổi 9.5đ... (Home Edition bị cấm).
- Giải HSG Cấp Tỉnh/Thành phố (Môn Toán, Lý, Hóa, Tin, Văn, Anh): Nhất (10đ), Nhì (9.5đ), Ba (9.0đ).
- Giải KHKT hoặc HSG Quốc gia: Khuyến khích (10đ).
=> Chỉ được chọn MỘT thành tích cao nhất để quy đổi, KHÔNG ĐƯỢC cộng dồn điểm IELTS và Giải HSG.

6. CÁC QUY TẮC CẦN NHỚ KHÁC
- Nếu thí sinh khai sai điểm trên hệ thống để trục lợi: Học viện sẽ HỦY KẾT QUẢ TRÚNG TUYỂN khi hậu kiểm hồ sơ gốc.
- Tính điểm Ưu tiên cho thí sinh > 22.5: Điểm ƯT = [(30 - Tổng điểm)/7.5] x Mức điểm ưu tiên gốc.
- Thiếu điểm Tin học ở 1 kỳ trong lớp 10, thí sinh KHÔNG ĐƯỢC chọn tổ hợp X06, X26.
- Diện 30a (Giảm nghèo) và nộp hồ sơ khuyết tật: Phải gửi hồ sơ về trường trước 20/06/2026.
- Chương trình DDP: Kể cả Tiếng Anh thấp vẫn có thể nhập học nếu đủ tổng điểm, nhưng cần cải thiện nhanh để theo kịp tiếng Anh.

Quy tắc trả lời của Bot:
- Phân tích cặn kẽ dựa trên Nhóm xét tuyển (1, 2, 3), Hạnh kiểm, Học lực khi thí sinh hỏi việc mình có đỗ hay đủ điều kiện hay không.
- Trình bày thông tin rõ ràng bằng Markdown. Giọng điệu thân thiện nhưng thể hiện sự chính xác tuyệt đối. 
- Nếu thí sinh cung cấp điểm GPA, IELTS hoặc điểm thi, HÃY TÍNH TOÁN THEO CÔNG THỨC và trả về điểm ĐXT cho họ.
`;

const INITIAL_MESSAGE = "Chào mừng bạn đến với hệ thống hỗ trợ tuyển sinh Học viện Tài chính 2025-2026. Tôi có thể giúp bạn tìm hiểu về các ngành đào tạo, chỉ tiêu, học phí hoặc các phương thức xét tuyển mới nhất.";

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
