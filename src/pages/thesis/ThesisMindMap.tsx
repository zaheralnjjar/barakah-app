import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Network, ZoomIn, ZoomOut, Maximize2, GitBranch, Circle, Triangle, AlignCenter, Layout } from 'lucide-react';
import { toast } from 'sonner';
import { ThesisService } from '@/services/thesis/ThesisService';
import { ThesisNode } from '@/types/thesis';
import { saveAs } from 'file-saver';
import { DocxGenerator } from '@/services/thesis/DocxGenerator';
import { FileSystemService } from '@/services/thesis/FileSystemService';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type LayoutType = 'tree' | 'radial' | 'horizontal';

export default function ThesisMindMap() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();

    // Dialog state
    const [selectedNode, setSelectedNode] = useState<ThesisNode | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    const [structure, setStructure] = useState<ThesisNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [layout, setLayout] = useState<LayoutType>('tree');
    const [hoveredNode, setHoveredNode] = useState<{ id: string; title: string; x: number; y: number } | null>(null);

    useEffect(() => {
        if (projectId) loadData();
    }, [projectId]);

    async function loadData() {
        try {
            setLoading(true);
            const data = await ThesisService.getStructure(projectId!);
            setStructure(data);
        } catch (e) {
            toast.error('فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }

    const typeColors: Record<string, string> = {
        chapter: '#8b5cf6',
        section: '#3b82f6',
        subsection: '#10b981',
        branch: '#f59e0b',
        topic: '#ec4899',
        issue: '#6366f1'
    };

    // تحويل الهيكل إلى إحداثيات حسب نوع العرض
    const mapData = useMemo(() => {
        const nodes: { id: string; title: string; fullTitle: string; type: string; x: number; y: number; parentId?: string }[] = [];
        const edges: { from: string; to: string }[] = [];

        // Helper to strip prefixes for cleaner tooltip
        const cleanNodeTitle = (title: string) => {
            return title.replace(/^(الفصل|المبحث|المطلب|الفرع|المسألة|الموضوع)\s+[\u0600-\u06FF]+\s*:\s*/, '').replace(/^.*:\s*/, '');
        };

        // حساب العرض الأفقي لكل شجرة فرعية
        const countLeaves = (node: ThesisNode): number => {
            if (!node.children || node.children.length === 0) return 1;
            return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
        };

        if (layout === 'tree') {
            // عرض شجري عمودي
            const processTree = (node: ThesisNode, level: number, startX: number, parentId?: string): number => {
                const leaves = countLeaves(node);
                const width = leaves * 250;
                const x = startX + width / 2;
                const y = 60 + level * 100;
                nodes.push({
                    id: node.id,
                    title: node.title.substring(0, 30) + (node.title.length > 30 ? '...' : ''),
                    fullTitle: cleanNodeTitle(node.title),
                    type: node.type,
                    x, y, parentId
                });

                if (parentId) edges.push({ from: parentId, to: node.id });

                if (node.children) {
                    let childX = startX;
                    node.children.forEach(child => {
                        const childWidth = countLeaves(child) * 200;
                        processTree(child, level + 1, childX, node.id);
                        childX += childWidth;
                    });
                }
                return width;
            };

            let startX = 50;
            structure.forEach(node => {
                startX += processTree(node, 0, startX) + 50;
            });

        } else if (layout === 'radial') {
            // عرض دائري
            const centerX = 400, centerY = 300;
            let nodeIndex = 0;

            const flatNodes: { node: ThesisNode; level: number; parentId?: string }[] = [];
            const flatten = (items: ThesisNode[], level: number, parentId?: string) => {
                items.forEach(n => {
                    flatNodes.push({ node: n, level, parentId });
                    if (n.children) flatten(n.children, level + 1, n.id);
                });
            };
            flatten(structure, 0);

            // ترتيب حسب المستوى
            const maxLevel = Math.max(...flatNodes.map(n => n.level), 0);

            flatNodes.forEach((item, i) => {
                const angle = (i / flatNodes.length) * 2 * Math.PI - Math.PI / 2;
                const radius = 80 + item.level * 100;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                nodes.push({
                    id: item.node.id,
                    title: item.node.title.substring(0, 15) + (item.node.title.length > 15 ? '...' : ''),
                    fullTitle: cleanNodeTitle(item.node.title),
                    type: item.node.type,
                    x, y, parentId: item.parentId
                });

                if (item.parentId) edges.push({ from: item.parentId, to: item.node.id });
            });

        } else if (layout === 'horizontal') {
            // عرض أفقي (من اليمين لليسار)
            const processHorizontal = (node: ThesisNode, level: number, startY: number, parentId?: string): number => {
                const leaves = countLeaves(node);
                const height = leaves * 60;
                const x = 700 - level * 180;
                const y = startY + height / 2;

                nodes.push({
                    id: node.id,
                    title: node.title.substring(0, 15) + (node.title.length > 15 ? '...' : ''),
                    fullTitle: cleanNodeTitle(node.title),
                    type: node.type,
                    x, y, parentId
                });

                if (parentId) edges.push({ from: parentId, to: node.id });

                if (node.children) {
                    let childY = startY;
                    node.children.forEach(child => {
                        const childHeight = countLeaves(child) * 60;
                        processHorizontal(child, level + 1, childY, node.id);
                        childY += childHeight;
                    });
                }
                return height;
            };

            let startY = 30;
            structure.forEach(node => {
                startY += processHorizontal(node, 0, startY) + 20;
            });
        }

        return { nodes, edges };
    }, [structure, layout]);

    // حساب حجم SVG الديناميكي
    const svgSize = useMemo(() => {
        if (mapData.nodes.length === 0) return { width: 800, height: 600 };
        const maxX = Math.max(...mapData.nodes.map(n => n.x)) + 150;
        const maxY = Math.max(...mapData.nodes.map(n => n.y)) + 100;
        return { width: Math.max(800, maxX), height: Math.max(600, maxY) };
    }, [mapData]);

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.3));
    const handleReset = () => setZoom(1);

    if (!projectId) return <div className="p-8 text-center">يرجى اختيار مشروع</div>;

    const handleNodeClick = (nodeId: string) => {
        // Find the node in the structure (recursively)
        const findNode = (nodes: ThesisNode[]): ThesisNode | undefined => {
            for (const n of nodes) {
                if (n.id === nodeId) return n;
                if (n.children) {
                    const found = findNode(n.children);
                    if (found) return found;
                }
            }
        };
        const node = findNode(structure);
        if (node) {
            setSelectedNode(node);
            setEditTitle(node.title);
            setIsDialogOpen(true);
        }
    };

    const handleSaveNode = async () => {
        if (!selectedNode || !projectId) return;
        try {
            await ThesisService.updateNode(selectedNode.id, { title: editTitle });
            setIsDialogOpen(false);
            loadData(); // Refresh
            toast.success('تم تحديث العنوان');
        } catch (e) {
            toast.error('فشل التحديث');
        }
    };

    const handleNodeHover = (id: string, title: string, x: number, y: number) => {
        setHoveredNode({ id, title, x, y });
    };

    const handleNodeLeave = () => {
        setHoveredNode(null);
    };

    return (
        <div className="min-h-screen bg-background p-6" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <Button variant="ghost" className="mb-2 gap-2" onClick={() => navigate(`/thesis/dashboard?project=${projectId}`)}>
                            <ArrowLeft className="w-4 h-4" /> العودة
                        </Button>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Network className="w-8 h-8 text-primary" />
                            الخريطة الذهنية
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Layout Selector */}
                        <Select value={layout} onValueChange={(v) => setLayout(v as LayoutType)}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tree">
                                    <div className="flex items-center gap-2">
                                        <GitBranch className="w-4 h-4" /> شجري
                                    </div>
                                </SelectItem>
                                <SelectItem value="radial">
                                    <div className="flex items-center gap-2">
                                        <Circle className="w-4 h-4" /> دائري
                                    </div>
                                </SelectItem>
                                <SelectItem value="horizontal">
                                    <div className="flex items-center gap-2">
                                        <Triangle className="w-4 h-4 rotate-90" /> أفقي
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8">
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mind Map */}
                <Card className="relative overflow-auto" style={{ height: '65vh' }}>
                    <CardContent className="p-0 h-full">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                جاري التحميل...
                            </div>
                        ) : (
                            <svg
                                width={svgSize.width * zoom}
                                height={svgSize.height * zoom}
                                viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
                                className="min-w-full"
                            >
                                {/* Edges */}
                                {mapData.edges.map((edge, i) => {
                                    const from = mapData.nodes.find(n => n.id === edge.from);
                                    const to = mapData.nodes.find(n => n.id === edge.to);
                                    if (!from || !to) return null;

                                    // منحنى بيزير للخطوط
                                    const midX = (from.x + to.x) / 2;
                                    const midY = (from.y + to.y) / 2;

                                    return (
                                        <path
                                            key={i}
                                            d={layout === 'horizontal'
                                                ? `M${from.x - 55} ${from.y} Q${midX} ${from.y} ${to.x + 55} ${to.y}`
                                                : `M${from.x} ${from.y + 20} Q${from.x} ${midY} ${to.x} ${to.y - 20}`
                                            }
                                            stroke="#94a3b8"
                                            strokeWidth="2"
                                            fill="none"
                                            opacity="0.6"
                                        />
                                    );
                                })}

                                {/* Nodes */}
                                {mapData.nodes.map(node => (
                                    <g
                                        key={node.id}
                                        transform={`translate(${node.x}, ${node.y})`}
                                        className="cursor-pointer"
                                        onClick={() => handleNodeClick(node.id)}
                                        onMouseEnter={() => handleNodeHover(node.id, node.fullTitle, node.x, node.y)}
                                        onMouseLeave={handleNodeLeave}
                                    >
                                        <rect
                                            x="-90"
                                            y="-20"
                                            width="180"
                                            height="40"
                                            rx="6"
                                            fill={typeColors[node.type] || '#64748b'}
                                            className="drop-shadow-md hover:brightness-110 transition-all hover:scale-105"
                                        />
                                        <text
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fill="white"
                                            fontSize="13"
                                            fontWeight="500"
                                            fontFamily="sans-serif"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {node.title}
                                        </text>
                                    </g>
                                ))}

                                {/* Tooltip للعنوان الكامل */}
                                {hoveredNode && (
                                    <g transform={`translate(${hoveredNode.x}, ${hoveredNode.y - 45})`}>
                                        <rect
                                            x={-Math.min(hoveredNode.title.length * 5, 150)}
                                            y="-14"
                                            width={Math.min(hoveredNode.title.length * 10, 300)}
                                            height="28"
                                            rx="4"
                                            fill="rgba(0,0,0,0.85)"
                                            className="drop-shadow-lg"
                                        />
                                        <text
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fill="white"
                                            fontSize="12"
                                            fontWeight="600"
                                            fontFamily="sans-serif"
                                        >
                                            {hoveredNode.title}
                                        </text>
                                    </g>
                                )}
                            </svg>
                        )}
                    </CardContent>
                </Card>

                {/* Legend */}
                <div className="flex items-center gap-4 justify-center flex-wrap bg-muted/50 rounded-lg p-3">
                    {Object.entries(typeColors).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                            <span className="text-sm">
                                {type === 'chapter' ? 'فصل' :
                                    type === 'section' ? 'مبحث' :
                                        type === 'subsection' ? 'مطلب' :
                                            type === 'branch' ? 'فرع' :
                                                type === 'topic' ? 'موضوع' : 'مسألة'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Node Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <div className="space-y-4 py-4">
                        <h2 className="text-lg font-bold">تعديل العنصر</h2>
                        <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            placeholder="العنوان الجديد"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                            <Button onClick={handleSaveNode}>حفظ</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
