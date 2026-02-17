import { prisma } from './prisma';
import type { Agent } from './types';
import type { Agent as PrismaAgent, Prisma } from '@prisma/client';

// ── Mappers ──

function toAgent(row: PrismaAgent): Agent {
    return {
        id: row.id,
        name: row.name,
        specialty: row.specialty ?? undefined,
        createdAt: row.createdAt.getTime(),
        updatedAt: row.updatedAt.getTime(),
        status: row.status as Agent['status'],
        policy: row.policy as unknown as Agent['policy'],
        conversationHistory: row.conversationHistory as unknown as Agent['conversationHistory'],
        onboardingComplete: row.onboardingComplete,
    };
}

// ── Queries ──

export async function getAgents(userId: string): Promise<Agent[]> {
    const rows = await prisma.agent.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });
    return rows.map(toAgent);
}

export async function getAgent(id: string, userId: string): Promise<Agent | null> {
    const row = await prisma.agent.findFirst({
        where: { id, userId },
    });
    return row ? toAgent(row) : null;
}

export async function createAgent(
    data: { name: string; specialty?: string; policy?: Agent['policy']; onboardingComplete?: boolean },
    userId: string
): Promise<Agent> {
    const row = await prisma.agent.create({
        data: {
            userId,
            name: data.name,
            specialty: data.specialty ?? null,
            ...(data.policy !== undefined && { policy: data.policy as unknown as Prisma.InputJsonValue }),
            ...(data.onboardingComplete !== undefined && { onboardingComplete: data.onboardingComplete }),
        },
    });
    return toAgent(row);
}

export async function updateAgent(
    id: string,
    userId: string,
    data: {
        name?: string;
        specialty?: string | null;
        status?: string;
        policy?: Agent['policy'];
        conversationHistory?: Agent['conversationHistory'];
        onboardingComplete?: boolean;
    }
): Promise<void> {
    // Build Prisma-compatible update data, handling JSON/null fields
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.specialty !== undefined) updateData.specialty = data.specialty;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.onboardingComplete !== undefined) updateData.onboardingComplete = data.onboardingComplete;
    if (data.policy !== undefined) {
        // Store policy JSON as-is when provided
        updateData.policy = data.policy;
    }
    if (data.conversationHistory !== undefined) {
        // Store conversation history JSON as-is when provided
        updateData.conversationHistory = data.conversationHistory;
    }

    await prisma.agent.updateMany({
        where: { id, userId },
        data: updateData,
    });
}

export async function deleteAgent(id: string, userId: string): Promise<void> {
    await prisma.agent.deleteMany({
        where: { id, userId },
    });
}
