import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuditLogs } from "@/hooks/iam";
import { AuditEvent } from "@/types/iam";
import { ListSkeleton } from "@/components/common/skeletons";

const events = Object.values(AuditEvent);

export function AuditPanel() {
  const logs = useAuditLogs(500);
  const [q, setQ] = useState("");
  const [event, setEvent] = useState("all");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (logs.data ?? []).filter((l) => {
      if (event !== "all" && l.event !== event) return false;
      if (!term) return true;
      return [l.userName, l.entity, l.entityId, l.detail].some((v) => v?.toLowerCase().includes(term));
    });
  }, [logs.data, q, event]);

  if (logs.isLoading) return <ListSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search user, entity or detail…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={event} onValueChange={setEvent}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {events.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="self-center text-sm text-muted-foreground">{rows.length} entries</span>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 200).map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(l.at).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">{l.userName}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{l.event}</Badge></TableCell>
                <TableCell className="text-sm">{l.entity}</TableCell>
                <TableCell>
                  <span className={l.result === "success" ? "text-xs text-emerald-500" : "text-xs text-destructive"}>
                    {l.result}
                  </span>
                </TableCell>
                <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">{l.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
