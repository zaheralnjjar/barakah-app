import React, { useState, useEffect, useCallback } from 'react';
import { Home, ArrowLeft, Settings, Calendar, Plus } from 'lucide-react';

interface RadialMenuAction {
    icon: React.ReactNode;
    label: string;
    action: string;
}

interface RadialMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    onClose: () => void;
    onAction: (action: string) => void;
    actions?: {
        top?: RadialMenuAction;
        right?: RadialMenuAction;
        bottom?: RadialMenuAction;
        left?: RadialMenuAction;
    };
}

const RadialMenu: React.FC<RadialMenuProps> = ({
    isOpen,
    position,
    onClose,
    onAction,
    actions = {
        top: { icon: <Calendar className="w-5 h-5" />, label: 'التقويم', action: 'calendar' },
        right: { icon: <Plus className="w-5 h-5" />, label: 'إضافة', action: 'add' },
        bottom: { icon: <ArrowLeft className="w-5 h-5" />, label: 'رجوع', action: 'back' },
        left: { icon: <Settings className="w-5 h-5" />, label: 'الإعدادات', action: 'settings' },
    }
}) => {
    const [visible, setVisible] = useState(false);
    const [hoveredQuadrant, setHoveredQuadrant] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Small delay for animation
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    const handleQuadrantClick = useCallback((quadrant: 'top' | 'right' | 'bottom' | 'left', e: React.MouseEvent) => {
        e.stopPropagation();
        const action = actions[quadrant];
        if (action) {
            onAction(action.action);
        }
        onClose();
    }, [actions, onAction, onClose]);

    const handleCenterClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onAction('home');
        onClose();
    }, [onAction, onClose]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    }, [onClose]);

    if (!isOpen) return null;

    const outerRadius = 90;
    const innerRadius = 35;
    const size = outerRadius * 2 + 10;

    return (
        <div
            className="fixed inset-0 z-[9999]"
            onClick={handleBackdropClick}
            style={{ touchAction: 'none' }}
        >
            {/* Backdrop with blur */}
            <div
                className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Radial Menu - positioned exactly at click point */}
            <div
                className={`absolute transition-all duration-200 ease-out ${visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
                style={{
                    left: position.x,
                    top: position.y,
                    marginLeft: -size / 2,
                    marginTop: -size / 2,
                    width: size,
                    height: size,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* SVG for the ring segments */}
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="drop-shadow-xl"
                >
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background circle for better visibility */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={outerRadius}
                        fill="rgba(255,255,255,0.1)"
                    />

                    {/* Quadrant buttons - Using simple clickable paths */}
                    {/* Top Quadrant */}
                    <path
                        d={createArcPath(size / 2, size / 2, innerRadius, outerRadius, -45, 45)}
                        className={`cursor-pointer transition-all duration-150 ${hoveredQuadrant === 'top' ? 'fill-green-400' : 'fill-green-500'}`}
                        stroke="#166534"
                        strokeWidth="2"
                        onClick={(e) => handleQuadrantClick('top', e)}
                        onMouseEnter={() => setHoveredQuadrant('top')}
                        onMouseLeave={() => setHoveredQuadrant(null)}
                    />

                    {/* Right Quadrant */}
                    <path
                        d={createArcPath(size / 2, size / 2, innerRadius, outerRadius, 45, 135)}
                        className={`cursor-pointer transition-all duration-150 ${hoveredQuadrant === 'right' ? 'fill-green-400' : 'fill-green-500'}`}
                        stroke="#166534"
                        strokeWidth="2"
                        onClick={(e) => handleQuadrantClick('right', e)}
                        onMouseEnter={() => setHoveredQuadrant('right')}
                        onMouseLeave={() => setHoveredQuadrant(null)}
                    />

                    {/* Bottom Quadrant */}
                    <path
                        d={createArcPath(size / 2, size / 2, innerRadius, outerRadius, 135, 225)}
                        className={`cursor-pointer transition-all duration-150 ${hoveredQuadrant === 'bottom' ? 'fill-green-400' : 'fill-green-500'}`}
                        stroke="#166534"
                        strokeWidth="2"
                        onClick={(e) => handleQuadrantClick('bottom', e)}
                        onMouseEnter={() => setHoveredQuadrant('bottom')}
                        onMouseLeave={() => setHoveredQuadrant(null)}
                    />

                    {/* Left Quadrant */}
                    <path
                        d={createArcPath(size / 2, size / 2, innerRadius, outerRadius, 225, 315)}
                        className={`cursor-pointer transition-all duration-150 ${hoveredQuadrant === 'left' ? 'fill-green-400' : 'fill-green-500'}`}
                        stroke="#166534"
                        strokeWidth="2"
                        onClick={(e) => handleQuadrantClick('left', e)}
                        onMouseEnter={() => setHoveredQuadrant('left')}
                        onMouseLeave={() => setHoveredQuadrant(null)}
                    />

                    {/* Center circle (Home button) */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={innerRadius - 3}
                        className="fill-white cursor-pointer hover:fill-gray-100 transition-colors"
                        stroke="#16a34a"
                        strokeWidth="3"
                        onClick={handleCenterClick}
                        filter="url(#glow)"
                    />
                </svg>

                {/* Icons overlay - positioned absolutely */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Center Home Icon */}
                    <div
                        className="absolute text-green-600 pointer-events-auto cursor-pointer"
                        style={{
                            left: size / 2 - 12,
                            top: size / 2 - 12,
                        }}
                        onClick={handleCenterClick}
                    >
                        <Home className="w-6 h-6" />
                    </div>

                    {/* Top Icon */}
                    <div
                        className="absolute text-white"
                        style={{
                            left: size / 2 - 10,
                            top: size / 2 - outerRadius + (outerRadius - innerRadius) / 2 - 10,
                        }}
                    >
                        {actions.top?.icon}
                    </div>

                    {/* Right Icon */}
                    <div
                        className="absolute text-white"
                        style={{
                            left: size / 2 + outerRadius - (outerRadius - innerRadius) / 2 - 10,
                            top: size / 2 - 10,
                        }}
                    >
                        {actions.right?.icon}
                    </div>

                    {/* Bottom Icon */}
                    <div
                        className="absolute text-white"
                        style={{
                            left: size / 2 - 10,
                            top: size / 2 + outerRadius - (outerRadius - innerRadius) / 2 - 10,
                        }}
                    >
                        {actions.bottom?.icon}
                    </div>

                    {/* Left Icon */}
                    <div
                        className="absolute text-white"
                        style={{
                            left: size / 2 - outerRadius + (outerRadius - innerRadius) / 2 - 10,
                            top: size / 2 - 10,
                        }}
                    >
                        {actions.left?.icon}
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute inset-0 pointer-events-none text-xs font-medium">
                    <div
                        className="absolute text-white bg-black/60 px-2 py-0.5 rounded whitespace-nowrap"
                        style={{ left: size / 2, top: 0, transform: 'translateX(-50%)' }}
                    >
                        {actions.top?.label}
                    </div>
                    <div
                        className="absolute text-white bg-black/60 px-2 py-0.5 rounded whitespace-nowrap"
                        style={{ right: 0, top: size / 2, transform: 'translateY(-50%)' }}
                    >
                        {actions.right?.label}
                    </div>
                    <div
                        className="absolute text-white bg-black/60 px-2 py-0.5 rounded whitespace-nowrap"
                        style={{ left: size / 2, bottom: 0, transform: 'translateX(-50%)' }}
                    >
                        {actions.bottom?.label}
                    </div>
                    <div
                        className="absolute text-white bg-black/60 px-2 py-0.5 rounded whitespace-nowrap"
                        style={{ left: 0, top: size / 2, transform: 'translateY(-50%)' }}
                    >
                        {actions.left?.label}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to create arc path
function createArcPath(
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
): string {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = cx + outerRadius * Math.cos(startRad);
    const y1 = cy + outerRadius * Math.sin(startRad);
    const x2 = cx + outerRadius * Math.cos(endRad);
    const y2 = cy + outerRadius * Math.sin(endRad);
    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

    return `
    M ${x1} ${y1}
    A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
    L ${x3} ${y3}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
    Z
  `;
}

export default RadialMenu;
