
// Import dependencies
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, '../public/pwa-512x512.png')
    });

    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        win.loadURL('http://localhost:5173'); // Default Vite port
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

// --- IPC Handlers ---

// 1. Select Directory
ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

// 2. Create Full Backup (Data JSON + Files)
ipcMain.handle('backup:create', async (event, { folderPath, data, backupPath }) => {
    try {
        const zip = new AdmZip();

        // Add project files folder if it exists
        if (folderPath && fs.existsSync(folderPath)) {
            // Adds everything inside folderPath into a 'files' folder in the zip
            zip.addLocalFolder(folderPath, 'files');
        }

        // Add data.json
        zip.addFile('data.json', Buffer.from(JSON.stringify(data, null, 2)));

        // Determine save path
        let targetPath = backupPath;
        if (!targetPath) {
            const result = await dialog.showSaveDialog({
                title: 'حفظ النسخة الاحتياطية',
                defaultPath: `barakah-backup-${new Date().toISOString().split('T')[0]}.zip`,
                filters: [{ name: 'Zip Files', extensions: ['zip'] }]
            });
            if (result.canceled) return { success: false, canceled: true };
            targetPath = result.filePath;
        }

        zip.writeZip(targetPath);
        return { success: true, path: targetPath };
    } catch (error) {
        console.error('Backup failed:', error);
        return { success: false, error: error.message };
    }
});

// 3. Restore Backup (Return Data + Extract Files Path Info)
ipcMain.handle('backup:restore', async (event) => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Zip Files', extensions: ['zip'] }]
        });

        if (result.canceled) return { canceled: true };

        const zipPath = result.filePaths[0];
        const zip = new AdmZip(zipPath);

        let data = null;
        const entry = zip.getEntry('data.json');
        if (entry) {
            data = JSON.parse(entry.getData().toString('utf8'));
        } else {
            return { success: false, error: 'ملف البيانات data.json غير موجود في النسخة' };
        }

        return { success: true, data, zipPath };
    } catch (error) {
        console.error('Restore failed:', error);
        return { success: false, error: error.message };
    }
});

// 4. Extract Files to Target Directory
ipcMain.handle('backup:extractFiles', async (event, { zipPath, targetFolder }) => {
    try {
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }

        const zip = new AdmZip(zipPath);

        // Extract the 'files' folder content to the target folder
        // getEntries() finds files starting with "files/"
        const zipEntries = zip.getEntries();
        let extractedCount = 0;

        zipEntries.forEach(function (zipEntry) {
            if (zipEntry.entryName.startsWith("files/") && !zipEntry.isDirectory) {
                // Remove "files/" prefix from internal path
                const relativePath = zipEntry.entryName.substring("files/".length);
                if (relativePath) {
                    // Extract
                    zip.extractEntryTo(zipEntry, targetFolder, true, true);
                    // Move/Rename if needed? 
                    // extractEntryTo with maintainEntryPath=true will create "files/..." structure inside targetFolder?
                    // No, if we pass the entry object, it accepts it.
                    // But adm-zip extractEntryTo documentation:
                    // extractEntryTo(entry, targetPath, maintainEntryPath, overwrite)
                    // If maintainEntryPath is true, it uses the full entryName (including "files/").
                    // We want to strip "files/". 

                    // So we probably need to handle writing manually or just accept "files/" folder inside target?
                    // User request: "Restore files and folders".
                    // If we restore into Project Folder, we probably want the files directly?
                    // If zip has "files/chapter1/doc.docx"
                    // We want "target/chapter1/doc.docx" NOT "target/files/chapter1/doc.docx".
                }
            }
        });

        // Easier approach: Extract all of "files/" into target directly
        // adm-zip doesn't support stripping prefix easily in one go.
        // We will loop and rewrite.

        zipEntries.forEach((entry) => {
            if (entry.entryName.startsWith('files/')) {
                const internalPath = entry.entryName;
                // files/subdir/file.txt
                const targetRelativePath = internalPath.replace(/^files\//, '');
                if (!targetRelativePath) return; // it is the files/ folder itself

                const fullTarget = path.join(targetFolder, targetRelativePath);
                const fullTargetDir = path.dirname(fullTarget);

                if (!fs.existsSync(fullTargetDir)) fs.mkdirSync(fullTargetDir, { recursive: true });

                if (!entry.isDirectory) {
                    fs.writeFileSync(fullTarget, entry.getData());
                }
                extractedCount++;
            }
        });

        return { success: true, count: extractedCount };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

