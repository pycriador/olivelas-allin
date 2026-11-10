import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Building2, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgStore } from "@/stores/org-store";
import type { OrgPermission } from "@/types/org";

interface Props {
  permission?: OrgPermission;
  children: (organizationId: string) => ReactNode;
}

/** Ensures an active organization + permission before rendering enterprise screens. */
export function OrgGuard({ permission, children }: Props) {
  const { t } = useTranslation();
  const { currentId, loaded, load, isLoading, can } = useOrgStore();

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  if (!loaded || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("org.noOrg.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("org.noOrg.subtitle")}</p>
        </CardContent>
      </Card>
    );
  }

  if (permission && !can(permission)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("org.noPermission")}</p>
        </CardContent>
      </Card>
    );
  }

  return <>{children(currentId)}</>;
}
