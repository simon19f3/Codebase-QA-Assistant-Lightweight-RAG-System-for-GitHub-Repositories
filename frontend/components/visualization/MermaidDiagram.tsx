import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { ZoomIn, ZoomOut, RefreshCcw, Move } from "lucide-react";

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const [svg, setSvg] = useState("");
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; lastX: number; lastY: number } | null>(null);

  useEffect(() => {
    // FIX: Force 'dark' theme regardless of website mode
    // and explicitly set all text variables to bright white/gray
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark", 
      themeVariables: {
        darkMode: true,
        background: "#0d1117",
        mainBkg: "#0d1117",
        
        // Force Text Colors to White/Light Gray
        primaryTextColor: "#e6edf3",
        secondaryTextColor: "#e6edf3",
        tertiaryTextColor: "#e6edf3",
        textColor: "#e6edf3",
        titleColor: "#e6edf3",
        nodeTextColor: "#e6edf3",
        
        // Lines and Borders
        primaryColor: "#1c1c1c",
        primaryBorderColor: "#3fb950", // Greenish border default
        lineColor: "#58a6ff",          // Blue connecting lines
        secondaryColor: "#161b22",
        tertiaryColor: "#161b22",
      },
      securityLevel: "loose",
    });

    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (error) {
        console.error("Failed to render mermaid chart", error);
      }
    };

    if (chart) renderChart();
  }, [chart]);

  // Zoom/Pan Handlers
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setScale(1.5);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, lastX: position.x, lastY: position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({ x: dragRef.current.lastX + dx, y: dragRef.current.lastY + dy });
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="relative w-full my-6 rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-[#0d1117] text-white">
      
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5 bg-[#161b22] p-1.5 rounded-lg border border-slate-700 shadow-xl opacity-90 hover:opacity-100 transition-opacity">
        <button onClick={handleZoomIn} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button onClick={handleZoomOut} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <button onClick={handleReset} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Reset View">
          <RefreshCcw size={16} />
        </button>
        <div className="w-px bg-slate-700 mx-0.5"></div>
        <div className="p-1.5 text-slate-500 cursor-grab" title="Drag to Pan">
          <Move size={16} />
        </div>
      </div>

      {/* Diagram Container */}
      <div 
        className={`w-full h-[500px] flex items-center justify-center overflow-hidden bg-[#0d1117] ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
          className="origin-center select-none pointer-events-none" // prevent selecting text while dragging
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
};

export default MermaidDiagram;