
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/open', (req, res) => {
    const { path: targetPath } = req.body;

    if (!targetPath) {
        return res.status(400).json({ error: 'Path is required' });
    }

    console.log(`Open request for: ${targetPath}`);

    // Command to open file/folder
    // macOS: open "path"
    // Windows: start "" "path"
    // Linux: xdg-open "path"

    let command;
    if (process.platform === 'darwin') {
        command = `open "${targetPath}"`;
    } else if (process.platform === 'win32') {
        command = `start "" "${targetPath}"`;
    } else {
        command = `xdg-open "${targetPath}"`;
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error opening path: ${error.message}`);
            return res.status(500).json({ error: 'Failed to open path', details: error.message });
        }
        res.json({ success: true, message: 'Opened successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`🌉 Native Bridge Server running on http://localhost:${PORT}`);
});
