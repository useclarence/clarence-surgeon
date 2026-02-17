import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAgents, createAgent } from '@/lib/db';
import type { Agent } from '@/lib/types';

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await getAgents(user.id);
    return NextResponse.json(agents);
}

export async function POST(req: Request) {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as {
        name: string;
        specialty?: string;
        policy?: Agent['policy'];
        onboardingComplete?: boolean;
    };
    const agent = await createAgent(
        { name: body.name, specialty: body.specialty, policy: body.policy, onboardingComplete: body.onboardingComplete },
        user.id
    );
    return NextResponse.json(agent);
}
