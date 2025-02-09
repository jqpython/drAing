import React, { useRef, useState, useEffect } from "react";
import { Eraser, Paintbrush, Undo2, RotateCcw, Wand2 } from "lucide-react";
import OpenAI from "openai";

interface Point {
  x: number;
  y: number;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPoint = useRef<Point | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = tool === "eraser" ? "white" : color;
  }, [color, tool]);

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    setIsDrawing(true);
    const point = getPoint(e);
    lastPoint.current = point;
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing || !contextRef.current || !lastPoint.current) return;

    const newPoint = getPoint(e);
    const ctx = contextRef.current;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(newPoint.x, newPoint.y);
    ctx.stroke();

    lastPoint.current = newPoint;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const getPoint = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setAiResponse(null);
  };

  const analyzeDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setLoading(true);
      setAiResponse(null);

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL("image/png").split(",")[1];

      // Send to OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "You are a friendly AI assistant for kids. Please describe what you see in this drawing in a fun, encouraging way that a child would enjoy. Keep it brief and positive. Start with 'I see...' or 'Wow!' or similar enthusiastic opener.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${imageData}`,
                },
              },
            ],
          },
        ],
        max_tokens: 150,
      });

      const aiMessage = response.choices[0]?.message?.content;
      if (aiMessage) {
        setAiResponse(aiMessage);
      }
    } catch (error) {
      console.error("Error analyzing drawing:", error);
      setAiResponse(
        "Oops! The magic wand needs a little rest. Try again in a moment!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setTool("brush")}
            className={`p-2 rounded-lg ${tool === "brush" ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100"}`}
          >
            <Paintbrush size={24} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-lg ${tool === "eraser" ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100"}`}
          >
            <Eraser size={24} />
          </button>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer"
          />
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-32"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <RotateCcw size={24} />
          </button>
          <button
            onClick={analyzeDrawing}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Wand2 size={20} />
            {loading ? "Magic happening..." : "Make it Magic!"}
          </button>
        </div>
      </div>
      <div className="flex-1 bg-gray-50 p-4">
        <div className="relative h-full">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full rounded-lg shadow-lg cursor-crosshair touch-none"
          />
          {aiResponse && (
            <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg border-2 border-purple-400 animate-fade-up">
              <p className="text-lg text-gray-800">{aiResponse}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
