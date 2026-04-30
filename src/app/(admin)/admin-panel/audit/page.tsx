import { prisma } from '@/lib/db/prisma';
import { formatDateTime } from '@/lib/utils/format';

async function getAuditLogs() {
  return prisma.auditLog.findMany({
    include: { admin: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export default async function AdminAuditPage() {
  const logs = await getAuditLogs();

  return (
    <div className="p-10">
      <h1 className="font-display text-3xl text-brand-cream mb-10">Audit-Log</h1>

      <div className="flex flex-col gap-px bg-brand-border font-mono text-xs">
        {logs.map((log) => (
          <div key={log.id} className="bg-brand-dark px-6 py-4 grid grid-cols-[160px_200px_1fr_120px] gap-6 items-center">
            <span className="text-brand-silver">{formatDateTime(log.createdAt)}</span>
            <span className="text-brand-gold">{log.action}</span>
            <span className="text-brand-silver truncate">
              {log.entityType && <>{log.entityType}: </>}
              {log.entityId?.slice(0, 12)}
              {log.details && <> · {JSON.stringify(log.details).slice(0, 50)}</>}
            </span>
            <span className="text-brand-silver text-right truncate">
              {log.admin?.email ?? 'system'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
