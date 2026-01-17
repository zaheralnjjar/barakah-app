import { ThesisNode } from '@/types/thesis';

// File System Access API Service
export class FileSystemService {
    private static directoryHandle: FileSystemDirectoryHandle | null = null;

    /**
     * طلب اختيار مجلد المشروع والحصول على المسار الكامل (Electron)
     */
    static async selectProjectDirectoryPath(): Promise<string | null> {
        try {
            // @ts-ignore
            if (window.electron && window.electron.ipcRenderer) {
                // @ts-ignore
                const path = await window.electron.ipcRenderer.invoke('dialog:openDirectory');
                return path;
            }
            console.warn('Electron not available');
            return null;
        } catch (error) {
            console.error('Failed to select directory:', error);
            return null;
        }
    }

    /**
     * طلب الوصول لمجلد المشروع من المستخدم
     */
    static async requestProjectDirectory(): Promise<FileSystemDirectoryHandle | null> {
        try {
            // @ts-ignore - File System Access API
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });
            this.directoryHandle = handle;

            // حفظ في IndexedDB للاستخدام لاحقاً
            await this.saveDirectoryHandle(handle);

            return handle;
        } catch (error) {
            console.error('Failed to get directory:', error);
            return null;
        }
    }

    /**
     * حفظ handle المجلد في IndexedDB
     */
    private static async saveDirectoryHandle(handle: FileSystemDirectoryHandle) {
        const db = await this.openDB();
        const tx = db.transaction('handles', 'readwrite');
        tx.objectStore('handles').put(handle, 'projectDirectory');
        // Wait for transaction to complete
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    /**
     * استرجاع handle المجلد من IndexedDB
     */
    static async getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
        if (this.directoryHandle) return this.directoryHandle;

        try {
            const db = await this.openDB();
            const tx = db.transaction('handles', 'readonly');
            const handle = await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
                const request = tx.objectStore('handles').get('projectDirectory');
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            if (handle) {
                // حفظ handle للاستخدام
                this.directoryHandle = handle;
                return handle;
            }
        } catch (error) {
            console.error('Failed to get saved directory:', error);
        }

        return null;
    }

    /**
     * فتح/إنشاء قاعدة بيانات IndexedDB
     */
    private static async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ThesisFileSystem', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles');
                }
            };
        });
    }

    /**
     * محاولة العثور على مجلد حتى لو كان له بادئة رقمية (مثل 01_المقدمة)
     * @param parentHandle المجلد الأب
     * @param targetName الاسم المستهدف (بدون أرقام)
     */
    static async findDirectoryByName(parentHandle: FileSystemDirectoryHandle, targetName: string): Promise<FileSystemDirectoryHandle | null> {
        // 1. Try exact match first
        try {
            return await parentHandle.getDirectoryHandle(targetName);
        } catch {
            // Ignore error
        }

        // 2. Search for prefixed folders (e.g. "01_TargetName")
        // Note: iterators in JS are async for FileSystem
        // @ts-ignore
        for await (const [name, handle] of parentHandle.entries()) {
            if (handle.kind === 'directory') {
                // Check if name ends with _targetName
                if (name === targetName || name.endsWith(`_${targetName}`)) {
                    return handle as FileSystemDirectoryHandle;
                }
            }
        }

    }

    /**
     * التحقق مما إذا كان العنصر يحتوي على ملف وورد
     */
    static async checkNodeHasFile(nodePath: string[], nodeTitle: string): Promise<boolean> {
        try {
            const rootHandle = await this.getDirectoryHandle();
            if (!rootHandle) return false;

            let currentHandle = rootHandle;
            for (const folderName of nodePath) {
                const found = await this.findDirectoryByName(currentHandle, folderName);
                if (!found) return false;
                currentHandle = found;
            }

            const filename = `${this.sanitizeFolderName(nodeTitle)}.docx`;
            try {
                await currentHandle.getFileHandle(filename);
                return true;
            } catch {
                return false;
            }
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * فتح الملف أو المجلد في مستكشف الملفات للنظام (Show in Finder/Explorer)
     * يعمل فقط في بيئة Electron
     */
    static async openInShell(path: string): Promise<boolean> {
        // 1. Try Electron Shell
        try {
            // @ts-ignore
            if (window.require) {
                const { shell } = window.require('electron');
                await shell.showItemInFolder(path);
                return true;
            }
        } catch (error) {
            // Electron not available
        }

        // 2. Try Local Bridge Server (for Browser/Localhost)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout to check if bridge is alive

            const response = await fetch('http://localhost:3001/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return true;
            }
        } catch (error) {
            console.log('Bridge server not available, falling back to clipboard');
        }

        return false;
    }

    /**
     * إنشاء هيكل المجلدات من البنية الشجرية مع ملفات DOCX
     */
    static async createStructure(
        nodes: ThesisNode[],
        parentHandle?: FileSystemDirectoryHandle,
        orderPrefix: string = '',
        settings?: any,
        generateFiles: boolean = false
    ): Promise<void> {
        const rootHandle = parentHandle || await this.getDirectoryHandle();
        if (!rootHandle) throw new Error('No directory handle');

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const prefix = `${String(i + 1).padStart(2, '0')}_`;
            const folderName = this.sanitizeFolderName(`${prefix}${node.title}`);

            // إنشاء مجلد للعنصر
            const nodeHandle = await rootHandle.getDirectoryHandle(folderName, { create: true });

            if (generateFiles) {
                // إنشاء ملف DOCX للعنصر في نفس المجلد إذا طلب ذلك
                const docxFilename = `${this.sanitizeFolderName(node.title)}.docx`;
                try {
                    await nodeHandle.getFileHandle(docxFilename);
                    // File exists, skip
                } catch {
                    // File doesn't exist, create it
                    const { DocxGenerator } = await import('./DocxGenerator');
                    const blob = await DocxGenerator.generateNodeDoc(node, settings);
                    const fileHandle = await nodeHandle.getFileHandle(docxFilename, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                }
            }

            // معالجة العناصر الفرعية بشكل تكراري
            if (node.children && node.children.length > 0) {
                await this.createStructure(node.children, nodeHandle, prefix, settings, generateFiles);
            }
        }
    }


    /**
     * إنشاء هيكل المجلدات باستخدام مسار النظام (Electron/Node)
     */
    static async createStructureAtPath(
        nodes: ThesisNode[],
        rootPath: string,
        generateFiles: boolean = false,
        settings?: any
    ): Promise<void> {
        try {
            // @ts-ignore
            if (!window.require) throw new Error('Not in Electron');
            // @ts-ignore
            const fs = window.require('fs');
            // @ts-ignore
            const path = window.require('path');
            const { DocxGenerator } = await import('./DocxGenerator');

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const prefix = `${String(i + 1).padStart(2, '0')}_`;
                const folderName = this.sanitizeFolderName(`${prefix}${node.title}`);
                const fullPath = path.join(rootPath, folderName);

                // Create directory
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath, { recursive: true });
                }

                if (generateFiles) {
                    const docxFilename = `${this.sanitizeFolderName(node.title)}.docx`;
                    const filePath = path.join(fullPath, docxFilename);

                    if (!fs.existsSync(filePath)) {
                        const blob = await DocxGenerator.generateNodeDoc(node, settings);
                        const arrayBuffer = await blob.arrayBuffer();
                        fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
                    }
                }

                // Recursion
                if (node.children && node.children.length > 0) {
                    await this.createStructureAtPath(node.children, fullPath, generateFiles, settings);
                }
            }
        } catch (error) {
            console.error('Failed to create structure at path:', error);
            throw error;
        }
    }

    /**
     * حفظ ملف DOCX في المجلد المناسب
     */
    static async saveDocxFile(
        blob: Blob,
        nodePath: string[],
        filename: string
    ): Promise<void> {
        const rootHandle = await this.getDirectoryHandle();
        if (!rootHandle) throw new Error('No directory handle');

        // التنقل للمجلد المناسب
        let currentHandle = rootHandle;
        for (const folder of nodePath) {
            currentHandle = await currentHandle.getDirectoryHandle(folder, { create: true });
        }

        // إنشاء/الكتابة للملف
        const fileHandle = await currentHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
    }

    /**
     * قراءة هيكل المجلدات وتحويله لبنية ThesisNode
     */
    static async readStructureFromFileSystem(): Promise<ThesisNode[]> {
        const rootHandle = await this.getDirectoryHandle();
        if (!rootHandle) throw new Error('No directory handle');

        return await this.readDirectory(rootHandle);
    }

    /**
     * قراءة مجلد بشكل تكراري
     */
    private static async readDirectory(
        dirHandle: FileSystemDirectoryHandle,
        parentId: string | null = null
    ): Promise<ThesisNode[]> {
        const nodes: ThesisNode[] = [];

        // @ts-ignore
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'directory') {
                // استخراج العنوان من اسم المجلد (إزالة الترقيم)
                const title = this.extractTitleFromFolderName(entry.name);

                const node: ThesisNode = {
                    id: crypto.randomUUID(),
                    project_id: '', // سيتم تحديثه لاحقاً
                    parent_id: parentId,
                    title: title,
                    type: this.guessNodeType(entry.name),
                    order_index: this.extractOrderFromFolderName(entry.name),
                    file_path: entry.name,
                    children: []
                };

                // قراءة المجلدات الفرعية
                node.children = await this.readDirectory(entry, node.id);

                nodes.push(node);
            }
        }

        return nodes.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }

    /**
     * تنظيف اسم المجلد من الأحرف غير المسموحة
     * Windows/Mac invalid chars: < > : " / \ | ? * 
     * Also remove: leading/trailing dots/spaces, control chars
     */
    public static sanitizeFolderName(name: string): string {
        let sanitized = name;

        // 1. Remove control characters & known dangerous chars explicitly first
        sanitized = sanitized.replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, '');

        // 2. Keep only Arabic/English letters, numbers, spaces, underscores, dashes, dots
        // \u0600-\u06FF covers Arabic script range
        sanitized = sanitized.replace(/[^\w\s\-\.\u0600-\u06FF]/g, '');

        sanitized = sanitized
            // Replace multiple spaces/underscores with single underscore
            .replace(/[\s_]+/g, '_')
            // Replace multiple dots with single
            .replace(/\.{2,}/g, '.')
            // Remove leading/trailing dots, spaces, underscores
            .replace(/^[._\s]+|[._\s]+$/g, '')
            .trim();

        // Ensure name is not empty
        if (!sanitized || sanitized.length === 0) {
            sanitized = 'unnamed_' + Date.now();
        }

        // Limit length (max 255 chars for most file systems)
        if (sanitized.length > 200) {
            sanitized = sanitized.substring(0, 200);
        }

        return sanitized;
    }

    /**
     * استخراج العنوان من اسم المجلد
     */
    private static extractTitleFromFolderName(folderName: string): string {
        // إزالة الترقيم من البداية (مثل "01_")
        return folderName.replace(/^\d+_/, '');
    }

    /**
     * استخراج الترتيب من اسم المجلد
     */
    private static extractOrderFromFolderName(folderName: string): number {
        const match = folderName.match(/^(\d+)_/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * تخمين نوع العنصر من اسم المجلد
     */
    private static guessNodeType(folderName: string): 'chapter' | 'section' | 'subsection' | 'branch' | 'issue' {
        const title = folderName.toLowerCase();

        if (title.includes('فصل') || title.includes('chapter')) return 'chapter';
        if (title.includes('مبحث') || title.includes('section')) return 'section';
        if (title.includes('مطلب') || title.includes('subsection')) return 'subsection';
        if (title.includes('فرع') || title.includes('branch')) return 'branch';
        if (title.includes('مسألة') || title.includes('issue')) return 'issue';

        // افتراضي
        return 'chapter';
    }

    /**
     * فتح المجلد في مستكشف الملفات (غير مدعوم في المتصفح)
     */
    static async openFolder(path: string): Promise<void> {
        // هذه الوظيفة تحتاج Electron
        console.warn('Opening folders is not supported in browser. Use Electron.');
    }

    /**
     * مقارنة هيكل نظام الملفات مع قاعدة البيانات
     */
    static compareStructures(
        fileSystemNodes: ThesisNode[],
        databaseNodes: ThesisNode[]
    ): {
        onlyInFileSystem: ThesisNode[];
        onlyInDatabase: ThesisNode[];
        matching: { fs: ThesisNode; db: ThesisNode }[];
    } {
        const result = {
            onlyInFileSystem: [] as ThesisNode[],
            onlyInDatabase: [] as ThesisNode[],
            matching: [] as { fs: ThesisNode; db: ThesisNode }[]
        };

        // Build title maps for comparison
        const fsMap = new Map<string, ThesisNode>();
        const dbMap = new Map<string, ThesisNode>();

        const flattenNodes = (nodes: ThesisNode[], prefix: string = ''): void => {
            nodes.forEach((node, i) => {
                const key = `${prefix}${i}_${node.title.toLowerCase().trim()}`;
                if (prefix === '') {
                    fsMap.set(key, node);
                }
                if (node.children && node.children.length > 0) {
                    flattenNodes(node.children, `${key}/`);
                }
            });
        };

        const flattenDbNodes = (nodes: ThesisNode[], prefix: string = ''): void => {
            nodes.forEach((node, i) => {
                const key = `${prefix}${i}_${node.title.toLowerCase().trim()}`;
                dbMap.set(key, node);
                if (node.children && node.children.length > 0) {
                    flattenDbNodes(node.children, `${key}/`);
                }
            });
        };

        flattenNodes(fileSystemNodes);
        flattenDbNodes(databaseNodes);

        // Compare
        for (const [key, fsNode] of fsMap) {
            if (dbMap.has(key)) {
                result.matching.push({ fs: fsNode, db: dbMap.get(key)! });
            } else {
                result.onlyInFileSystem.push(fsNode);
            }
        }

        for (const [key, dbNode] of dbMap) {
            if (!fsMap.has(key)) {
                result.onlyInDatabase.push(dbNode);
            }
        }

        return result;
    }

    /**
     * جلب ملخص الفروقات للعرض للمستخدم
     */
    static getSyncSummary(
        fileSystemNodes: ThesisNode[],
        databaseNodes: ThesisNode[]
    ): string {
        const comparison = this.compareStructures(fileSystemNodes, databaseNodes);

        const lines: string[] = [];
        lines.push(`📊 ملخص المزامنة:`);
        lines.push(`✅ متطابق: ${comparison.matching.length} عنصر`);

        if (comparison.onlyInFileSystem.length > 0) {
            lines.push(`➕ في الملفات فقط: ${comparison.onlyInFileSystem.length} عنصر`);
            comparison.onlyInFileSystem.slice(0, 5).forEach(n => {
                lines.push(`   - ${n.title}`);
            });
            if (comparison.onlyInFileSystem.length > 5) {
                lines.push(`   ... و ${comparison.onlyInFileSystem.length - 5} آخرين`);
            }
        }

        if (comparison.onlyInDatabase.length > 0) {
            lines.push(`⚠️ في قاعدة البيانات فقط: ${comparison.onlyInDatabase.length} عنصر`);
            comparison.onlyInDatabase.slice(0, 5).forEach(n => {
                lines.push(`   - ${n.title}`);
            });
            if (comparison.onlyInDatabase.length > 5) {
                lines.push(`   ... و ${comparison.onlyInDatabase.length - 5} آخرين`);
            }
        }

        return lines.join('\n');
    }

    /**
     * مزامنة التغييرات من نظام الملفات إلى قاعدة البيانات بذكاء
     */
    static async syncToDatabase(
        projectId: string,
        dbNodes: ThesisNode[],
        fsNodes: ThesisNode[],
        onUpdate: (msg: string) => void
    ): Promise<void> {
        const { ThesisService } = await import('@/services/thesis/ThesisService');

        // Helper to find operations
        const operations: Array<() => Promise<void>> = [];
        let addedCount = 0;
        let updatedCount = 0;
        let deletedCount = 0;

        const processLevel = (dbList: ThesisNode[], fsList: ThesisNode[], parentId: string | null) => {
            // Create maps for easier lookup
            const dbMapByTitle = new Map(dbList.map(n => [n.title, n]));
            const dbMapByOrder = new Map(dbList.map(n => [n.order_index, n]));

            // Track processed DB IDs to identify deletions later
            const processedDbIds = new Set<string>();

            // 1. Process FS nodes
            for (const fsNode of fsList) {
                let match: ThesisNode | undefined;

                // Try Exact Match (Title + Order) -- Implicitly handled by checking title or order match individually and seeing no change?
                // Actually, let's prioritize Title match (Move) over Order match (Rename) to avoid accidental renames of different content

                // Strategy:
                // A. Check if Title exists in DB list
                if (dbMapByTitle.has(fsNode.title)) {
                    match = dbMapByTitle.get(fsNode.title)!;
                    processedDbIds.add(match.id);

                    // Check if Move (Order changed)
                    if (match.order_index !== fsNode.order_index) {
                        operations.push(async () => {
                            await ThesisService.updateNode(match!.id, { order_index: fsNode.order_index });
                        });
                        updatedCount++;
                    }
                    // Update content if needed (not implementing content sync for now as it's complex, just structure)
                }
                // B. Check if Order exists (and assume Rename if sensible?)
                // This is risky. If I swap two folders, Order-based matching might rename them to each other, swapping their IDs/Metadata.
                // Safer to only assume Rename if NO other match found and it's the ONLY item at that index?
                // Use Heuristic: If Title Match failed, look for Order Match. 
                // BUT: Only if that DB node wasn't claimed by another Title Match.
                else if (dbMapByOrder.has(fsNode.order_index)) {
                    const potentialMatch = dbMapByOrder.get(fsNode.order_index)!;
                    // Only use if this DB node hasn't been matched by Title to another FS node
                    // We can't know for sure yet if another FS node will claim it by Title.
                    // So we need a two-pass approach.
                }
            }
        };

        // Improved reconciliation algorithm
        const reconcile = async (dbList: ThesisNode[], fsList: ThesisNode[], parentId: string | null) => {
            const dbUnmatched = new Set(dbList.map(n => n.id));
            const fsUnmatched = new Set(fsList);

            // Pass 1: Match by Title (Handles Moves & Unchanged)
            for (const fsNode of fsUnmatched) {
                const dbNode = dbList.find(n => n.title === fsNode.title); // Simplistic title match
                if (dbNode && dbUnmatched.has(dbNode.id)) {
                    // Match Found!
                    dbUnmatched.delete(dbNode.id);
                    fsUnmatched.delete(fsNode);

                    // Check for updates
                    if (dbNode.order_index !== fsNode.order_index) {
                        operations.push(async () => {
                            await ThesisService.updateNode(dbNode.id, { order_index: fsNode.order_index });
                        });
                        updatedCount++;
                    }

                    // Recurse for children
                    await reconcile(dbNode.children || [], fsNode.children || [], dbNode.id);
                }
            }

            // Pass 2: Match by Order (Handles Renames)
            // Only consider if we are confident? 
            // Risky scenario: User deletes "Chapter 1" and adds "New Chapter 1". 
            // Should we treat as rename (preserving metadata) or Delete+Add?
            // "Sync edits" implies keeping metadata. Let's try to match by Order Index if unmatched.
            for (const fsNode of fsUnmatched) {
                const dbNode = dbList.find(n => n.order_index === fsNode.order_index && dbUnmatched.has(n.id));
                if (dbNode) {
                    // Start of Rename Logic
                    dbUnmatched.delete(dbNode.id);
                    fsUnmatched.delete(fsNode);

                    operations.push(async () => {
                        await ThesisService.updateNode(dbNode.id, { title: fsNode.title });
                    });
                    updatedCount++;

                    // Recurse for children
                    await reconcile(dbNode.children || [], fsNode.children || [], dbNode.id);
                }
            }

            // Pass 3: Handle Remaining FS Nodes (Additions)
            for (const fsNode of fsUnmatched) {
                operations.push(async () => {
                    const newNode = await ThesisService.addNode({
                        project_id: projectId,
                        parent_id: parentId,
                        title: fsNode.title,
                        type: fsNode.type,
                        order_index: fsNode.order_index,
                        file_path: fsNode.file_path
                    });

                    // Add children of new node
                    if (fsNode.children && fsNode.children.length > 0) {
                        // We need a way to recurse with the new ID. 
                        // Since operations are batched, we might need to await immediately for adds?
                        // Or restructure to run Add immediately.
                        await importChildren(fsNode.children, newNode.id);
                    }
                });
                addedCount++;
            }

            // Pass 4: Handle Remaining DB Nodes (Deletions)
            for (const dbId of dbUnmatched) {
                operations.push(async () => {
                    // await ThesisService.deleteNode(dbId); // Risky? Maybe just mark status?
                    // User asked for sync. If explicit delete in FS, should delete in DB?
                    // Let's protect against accidental mass deletions.
                    // Only delete if leaf node? Or provide "Trash" support?
                    // For now, let's NOT delete automatically to be safe, or maybe enable via flag.
                    console.log(`Skipping delete for ${dbId} - Manual deletion preferred for safety`);
                });
                // deletedCount++;
            }
        };

        const importChildren = async (nodes: ThesisNode[], parentId: string) => {
            for (const node of nodes) {
                const newNode = await ThesisService.addNode({
                    project_id: projectId,
                    parent_id: parentId,
                    title: node.title,
                    type: node.type,
                    order_index: node.order_index,
                    file_path: node.file_path
                });
                if (node.children && node.children.length > 0) {
                    await importChildren(node.children, newNode.id);
                }
            }
        };

        await reconcile(dbNodes, fsNodes, null);

        // Execute operations
        onUpdate(`جاري تنفيذ ${operations.length} عملية تحديث...`);
        for (const op of operations) {
            await op();
        }

        onUpdate(`تم: ${updatedCount} تحديث، ${addedCount} إضافة`);
    }

    /**
     * التحقق من دعم File System Access API
     */
    static isSupported(): boolean {
        return 'showDirectoryPicker' in window;
    }

    /**
     * الحصول على معلومات الملف (وجوده، تاريخ التعديل)
     */
    static async getFileStatus(
        nodePath: string[],
        nodeTitle: string,
        lastSyncedAt?: string
    ): Promise<{ exists: boolean; lastModified?: Date; needsSync: boolean }> {
        try {
            const rootHandle = await this.getDirectoryHandle();
            if (!rootHandle) return { exists: false, needsSync: false };

            let currentHandle = rootHandle;
            for (const folderName of nodePath) {
                const found = await this.findDirectoryByName(currentHandle, folderName);
                if (!found) return { exists: false, needsSync: false };
                currentHandle = found;
            }

            const filename = `${this.sanitizeFolderName(nodeTitle)}.docx`;
            const fileHandle = await currentHandle.getFileHandle(filename);
            const file = await fileHandle.getFile();

            const lastModified = new Date(file.lastModified);
            // If never synced, or file is newer than last sync
            const needsSync = !lastSyncedAt || lastModified.getTime() > new Date(lastSyncedAt).getTime();

            return { exists: true, lastModified, needsSync };
        } catch {
            return { exists: false, needsSync: false };
        }
    }

    /**
     * قراءة محتوى الملف النصي وتحديث قاعدة البيانات
     */
    static async syncNodeWithFile(node: ThesisNode, nodePath: string[]): Promise<boolean> {
        try {
            const rootHandle = await this.getDirectoryHandle();
            if (!rootHandle) return false;

            let currentHandle = rootHandle;
            for (const folderName of nodePath) {
                const found = await this.findDirectoryByName(currentHandle, folderName);
                if (!found) return false;
                currentHandle = found;
            }

            const filename = `${this.sanitizeFolderName(node.title)}.docx`;
            const fileHandle = await currentHandle.getFileHandle(filename);
            const file = await fileHandle.getFile();
            const arrayBuffer = await file.arrayBuffer();

            // Dynamic import of mammoth
            // @ts-ignore
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ arrayBuffer });
            const content = result.value;

            // Update Database
            const { ThesisService } = await import('./ThesisService');
            await ThesisService.updateNode(node.id, {
                content: content,
                last_synced_at: new Date().toISOString(),
                file_last_modified: new Date(file.lastModified).toISOString()
            });

            return true;
        } catch (error) {
            console.error(`Failed to sync node ${node.title}:`, error);
            return false;
        }
    }
}
