
import React, { useRef, useState } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { Button } from '@/components/ui/button';
import { Check, X, Eraser, Pen, Undo, Redo } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DrawingCanvasProps {
    onSave: (imageSrc: string) => void;
    onCancel: () => void;
}

const colors = ['#000000', '#FF0000', '#0000FF', '#008000', '#FFFF00', '#FFA500', '#800080'];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSave, onCancel }) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [eraserMode, setEraserMode] = useState(false);

    const handleSave = async () => {
        if (canvasRef.current) {
            const dataUrl = await canvasRef.current.exportImage('png');
            onSave(dataUrl);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                    {/* Color Picker */}
                    <div className="flex gap-1">
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => {
                                    setStrokeColor(color);
                                    setEraserMode(false);
                                }}
                                className={`w-6 h-6 rounded-full border border-gray-300 ${strokeColor === color && !eraserMode ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-2" />

                    {/* Tools */}
                    <Button
                        variant={!eraserMode ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setEraserMode(false)}
                        className="h-8 w-8"
                    >
                        <Pen className="w-4 h-4" />
                    </Button>

                    <Button
                        variant={eraserMode ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setEraserMode(true)}
                        className="h-8 w-8"
                    >
                        <Eraser className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-2" />

                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => canvasRef.current?.undo()}>
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => canvasRef.current?.redo()}>
                        <Redo className="w-4 h-4" />
                    </Button>

                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <X className="w-4 h-4 mr-1" />
                        إلغاء
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                        <Check className="w-4 h-4 mr-1" />
                        حفظ الرسم
                    </Button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-white cursor-crosshair relative">
                <ReactSketchCanvas
                    ref={canvasRef}
                    strokeWidth={strokeWidth}
                    strokeColor={strokeColor}
                    eraserWidth={20}
                    canvasColor="transparent"
                    style={{ border: 'none' }}
                />

                {/* Visual indicator for eraser */}
                {eraserMode && (
                    <div className="absolute top-4 right-4 bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold pointer-events-none">
                        Eraser Mode
                    </div>
                )}
            </div>
        </div>
    );
};
