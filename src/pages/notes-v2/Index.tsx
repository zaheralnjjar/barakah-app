import React from 'react';
import { UnifiedNotesLayout } from '@/components/notes-v2/UnifiedNotesLayout';

const NotesLayoutV2 = () => {
    // Render the unified layout in "System" mode (part of Baraka)
    return (
        <UnifiedNotesLayout isStandalone={false} />
    );
};

export default NotesLayoutV2;
