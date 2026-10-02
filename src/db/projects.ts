import { db } from './index.ts';
import { projects, users } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export interface ProjectStats {
  fileCount: number;
  totalBytes: number;
  totalBlocks: number;
  lineCount: number;
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null,
  photoUrl?: string | null
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
          photoUrl: photoUrl || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database getOrCreateUser failed:', error);
    throw new Error('Failed to synchronize user profile', { cause: error });
  }
}

export async function getUserProjects(userId: string) {
  try {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  } catch (error) {
    console.error('Database getUserProjects failed:', error);
    throw new Error('Failed to retrieve user projects', { cause: error });
  }
}

export async function getProjectById(id: number, userId: string) {
  try {
    const result = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return result[0] || null;
  } catch (error) {
    console.error('Database getProjectById failed:', error);
    throw new Error('Failed to retrieve project details', { cause: error });
  }
}

export async function createProject(data: {
  userId: string;
  title: string;
  description?: string;
  rawTranscript: string;
  parsedFiles: any;
  stats: ProjectStats;
  thumbnailGradient?: string;
}) {
  try {
    const result = await db
      .insert(projects)
      .values({
        userId: data.userId,
        title: data.title,
        description: data.description || null,
        rawTranscript: data.rawTranscript,
        parsedFiles: data.parsedFiles,
        stats: data.stats,
        thumbnailGradient:
          data.thumbnailGradient || 'from-neutral-900 via-neutral-950 to-black',
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database createProject failed:', error);
    throw new Error('Failed to create project', { cause: error });
  }
}

export async function updateProject(
  id: number,
  userId: string,
  data: {
    title?: string;
    description?: string;
    rawTranscript?: string;
    parsedFiles?: any;
    stats?: ProjectStats;
    isStarred?: number;
  }
) {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.rawTranscript !== undefined) updateData.rawTranscript = data.rawTranscript;
    if (data.parsedFiles !== undefined) updateData.parsedFiles = data.parsedFiles;
    if (data.stats !== undefined) updateData.stats = data.stats;
    if (data.isStarred !== undefined) updateData.isStarred = data.isStarred;

    const result = await db
      .update(projects)
      .set(updateData)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Database updateProject failed:', error);
    throw new Error('Failed to update project', { cause: error });
  }
}

export async function deleteProject(id: number, userId: string) {
  try {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Database deleteProject failed:', error);
    throw new Error('Failed to delete project', { cause: error });
  }
}
