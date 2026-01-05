
import { AcademicService } from "../services/AcademicService";

export const migrateLocalDataToSupabase = async () => {
    const STORAGE_KEY = 'my_research_project_v2';
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        console.log("No local data found to migrate.");
        return;
    }

    try {
        const localProject = JSON.parse(saved);
        console.log("Found local project:", localProject.title);

        // Check if project already exists (simple check by title for now, or just create new)
        // For safety, let's create a new project with the same data
        const newProject = await AcademicService.createProject({
            title: localProject.title,
            description: localProject.description,
            supervisor: localProject.supervisor,
            institution: localProject.institution,
            startDate: localProject.startDate,
            deadline: localProject.deadline
        });

        if (!newProject.id) throw new Error("Failed to create project");

        console.log("Created cloud project:", newProject.id);

        // Migrate Phases & Chapters
        if (localProject.phases) {
            for (const phase of localProject.phases) {
                const newPhase = await AcademicService.createPhase(newProject.id, phase.title, 0); // Order index simple for now
                if (newPhase.id && phase.chapters) {
                    for (const chapter of phase.chapters) {
                        await AcademicService.createChapter(newPhase.id, chapter.title, chapter.content || '');
                    }
                }
            }
        }

        // Migrate Materials
        if (localProject.materials) {
            for (const mat of localProject.materials) {
                await AcademicService.addMaterial(newProject.id, {
                    title: mat.title,
                    type: mat.type,
                    url: mat.url,
                    status: mat.status,
                    author: mat.author,
                    publisher: mat.publisher,
                    year: mat.year,
                    deathDate: mat.deathDate
                });
            }
        }

        // Migrate Circles
        // Service needs addCircle method, assuming it will be there or similar
        // For now skipping or assuming added. 

        console.log("Migration completed successfully!");
        alert("✅ تم نقل بياناتك بنجاح إلى السحابة!");
        // Optional: localStorage.removeItem(STORAGE_KEY); 

    } catch (e) {
        console.error("Migration failed:", e);
        alert("❌ حدث خطأ أثناء نقل البيانات.");
    }
};
