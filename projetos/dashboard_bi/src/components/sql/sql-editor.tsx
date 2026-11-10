import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import type { SqlEditorProps } from "./sql-editor-impl";

const Impl = lazy(() => import("./sql-editor-impl"));

/** SSR-safe wrapper: CodeMirror only loads after hydration. */
export function SqlEditor(props: SqlEditorProps) {
  const fallback = <Skeleton className="w-full rounded-md" style={{ height: props.height ?? "280px" }} />;
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <Impl {...props} />
      </Suspense>
    </ClientOnly>
  );
}