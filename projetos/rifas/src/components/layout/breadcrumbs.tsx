import { Link, useRouterState } from "@tanstack/react-router";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ROUTE_LABELS } from "@/config/navigation";

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard">RaffleHub</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => (
          <Fragment key={segment}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === segments.length - 1 ? (
                <BreadcrumbPage>{ROUTE_LABELS[segment] ?? segment}</BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">{ROUTE_LABELS[segment] ?? segment}</span>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
