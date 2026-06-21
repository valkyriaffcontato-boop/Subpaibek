import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { runTool } from '@/lib/docker';
import { isAllowedTarget } from '@/lib/security';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { target } = await req.json();

  if (!isAllowedTarget(target)) {
    return new Response("Target não permitido ou blacklistado", { status: 403 });
  }

  const scan = await prisma.scan.create({
    data: { tool: 'nmap', targetId: "...", userId: session.user.id, status: 'running' }
  });

  try {
    const result = await runTool('nmap', ['-sV', '-T4'], target);
    
    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: 'completed', result: { output: result } }
    });

    return Response.json({ success: true, result });
  } catch (e) {
    return Response.json({ error: "Scan falhou" }, { status: 500 });
  }
}
