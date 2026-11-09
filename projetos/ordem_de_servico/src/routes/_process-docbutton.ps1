param()

$routeDir = "C:\Users\willi\Downloads\projetos\serviceforge-chatgpt\src\routes"

# Define file mappings: module, page, title
$fileMap = @{
    # AI module
    "_app.ai.providers.tsx"    = @{module="ai"; page="providers"}
    "_app.ai.prompts.tsx"      = @{module="ai"; page="prompts"}
    "_app.ai.ocr.tsx"          = @{module="ai"; page="ocr"}
    "_app.ai.vision.tsx"       = @{module="ai"; page="vision"}
    "_app.ai.playground.tsx"   = @{module="ai"; page="playground"}
    "_app.ai.queue.tsx"        = @{module="ai"; page="queue"}
    "_app.ai.history.tsx"      = @{module="ai"; page="history"}
    "_app.ai.audit.tsx"        = @{module="ai"; page="audit"}
    "_app.ai.config.tsx"       = @{module="ai"; page="config"}
    "_app.ai.conference.tsx"   = @{module="ai"; page="conference"}

    # Communication
    "_app.communication.dashboard.tsx"  = @{module="communication"; page="dashboard"}
    "_app.communication.channels.tsx"   = @{module="communication"; page="channels"}
    "_app.communication.templates.tsx"  = @{module="communication"; page="templates"}
    "_app.communication.rules.tsx"      = @{module="communication"; page="rules"}
    "_app.communication.schedules.tsx"  = @{module="communication"; page="schedules"}
    "_app.communication.queue.tsx"      = @{module="communication"; page="queue"}
    "_app.communication.inbox.tsx"      = @{module="communication"; page="inbox"}
    "_app.communication.history.tsx"    = @{module="communication"; page="history"}
    "_app.communication.preferences.tsx" = @{module="communication"; page="preferences"}
    "_app.communication.audit.tsx"      = @{module="communication"; page="audit"}

    # Documents
    "_app.documents.designer.tsx"      = @{module="documents"; page="designer"}
    "_app.documents.templates.tsx"     = @{module="documents"; page="templates"}
    "_app.documents.generator.tsx"     = @{module="documents"; page="generator"}
    "_app.documents.signatures.tsx"    = @{module="documents"; page="signatures"}
    "_app.documents.storage.tsx"       = @{module="documents"; page="storage"}
    "_app.documents.versions.tsx"      = @{module="documents"; page="versions"}
    "_app.documents.export.tsx"        = @{module="documents"; page="export"}
    "_app.documents.print.tsx"         = @{module="documents"; page="print"}
    "_app.documents.history.tsx"       = @{module="documents"; page="history"}
    "_app.documents.audit.tsx"         = @{module="documents"; page="audit"}
    "_app.documents.qr-validation.tsx"  = @{module="documents"; page="qr-validation"}

    # Events
    "_app.events.subscribers.tsx"  = @{module="events"; page="subscribers"}
    "_app.events.workflows.tsx"    = @{module="events"; page="workflows"}
    "_app.events.history.tsx"      = @{module="events"; page="history"}
    "_app.events.monitor.tsx"      = @{module="events"; page="monitor"}
    "_app.events.audit.tsx"        = @{module="events"; page="audit"}

    # Integrations
    "_app.integrations.connectors.tsx"   = @{module="integrations"; page="connectors"}
    "_app.integrations.connections.tsx"  = @{module="integrations"; page="connections"}
    "_app.integrations.webhooks.tsx"     = @{module="integrations"; page="webhooks"}
    "_app.integrations.apis.tsx"         = @{module="integrations"; page="apis"}
    "_app.integrations.syncs.tsx"        = @{module="integrations"; page="syncs"}
    "_app.integrations.templates.tsx"    = @{module="integrations"; page="templates"}
    "_app.integrations.logs.tsx"         = @{module="integrations"; page="logs"}
    "_app.integrations.monitoring.tsx"   = @{module="integrations"; page="monitoring"}
    "_app.integrations.health.tsx"       = @{module="integrations"; page="health"}
    "_app.integrations.marketplace.tsx"  = @{module="integrations"; page="marketplace"}
}

$importLine = 'import { DocButton } from "@/components/doc-button";'

function Add-ImportAndDocButton {
    param($filePath, $module, $page)

    $content = Get-Content -Path $filePath -Raw
    $original = $content

    # Add import if not present
    if ($content -notmatch [regex]::Escape($importLine)) {
        $content = $content -replace '(import\s+\{[\s\S]*?\}\s+from\s+"@\/modules\/[\s\S]*?";)', "`$1`n$importLine"
        # Fallback: add after last import
        if ($content -eq $original) {
            $content = $content -replace '(import\s+[\s\S]*?;)\s*(\r?\n|$)', "`$1`n$importLine`n"
        }
    }

    $docButton = "<DocButton module=`"$module`" page=`"$page`" />"

    # Pattern 1: <div className="flex items-center justify-between">
    if ($content -match '(?s)(<div\s+className="flex\s+items-center\s+justify-between">.*?)(<h[12]\s[^>]*>.*?</h[12]>)') {
        $before = $Matches[1]
        $heading = $Matches[2]
        $content = $content -replace [regex]::Escape($before + $heading), ($before + $heading + "`n          " + $docButton)
    }
    # Pattern 2: <div className="flex items-start justify-between gap-4">
    elseif ($content -match '(?s)(<div\s+className="flex\s+items-start\s+justify-between\s+gap-4">.*?)(<h[12]\s[^>]*>.*?</h[12]>)') {
        $before = $Matches[1]
        $heading = $Matches[2]
        $content = $content -replace [regex]::Escape($before + $heading), ($before + $heading + "`n          " + $docButton)
    }
    # Pattern 3: <h2> alone (no flex wrapper)
    elseif ($content -match '(?s)(<h2\s+className="text-lg\s+font-semibold">.*?</h2>)') {
        $h2 = $Matches[1]
        $replacement = "<div className=`"flex items-center gap-2`">`n        $h2`n        $docButton`n      </div>"
        $content = $content -replace [regex]::Escape($h2), $replacement
    }
    # Pattern 4: <div><h1 className="text-2xl..."> ... </div> (title + description)
    elseif ($content -match '(?s)(<div>\s*\n\s*<h1\s+className="text-2xl\s+font-semibold\s+tracking-tight">.*?</h1>\s*\n\s*<p\s+className="text-sm\s+text-muted-foreground">.*?</p>\s*\n\s*</div>)') {
        $block = $Matches[1]
        $inner = $block -replace '</h1>', "</h1>`n          $docButton"
        $inner = $inner -replace '<div>', '<div className="flex items-center gap-2">'
        $content = $content -replace [regex]::Escape($block), $inner
    }
    # Pattern 5: <div className="flex items-center gap-3"><h2... (like ai.queue)
    elseif ($content -match '(?s)(<div\s+className="flex\s+items-center\s+gap-3">\s*\n\s*<h2[^>]*>.*?</h2>)') {
        $block = $Matches[1]
        $content = $content -replace [regex]::Escape($block), ($block + "`n        " + $docButton)
    }
    # Pattern 6: <div><h1> (simple wrapper) without <p>
    elseif ($content -match '(?s)(<div>\s*\n\s*<h1\s+className="text-2xl\s+font-semibold\s+tracking-tight">.*?</h1>)') {
        $block = $Matches[1]
        $replacement = $block -replace '<div>', '<div className="flex items-center gap-2">'
        $replacement = $replacement -replace '</h1>', "</h1>`n          $docButton"
        $content = $content -replace [regex]::Escape($block), $replacement
    }
    else {
        Write-Host "WARNING: No pattern matched for $filePath"
        return
    }

    if ($content -ne $original) {
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "OK: $filePath"
    } else {
        Write-Host "NO CHANGE: $filePath"
    }
}

foreach ($entry in $fileMap.GetEnumerator()) {
    $filePath = Join-Path $routeDir $entry.Key
    if (Test-Path $filePath) {
        Add-ImportAndDocButton -filePath $filePath -module $entry.Value.module -page $entry.Value.page
    } else {
        Write-Host "NOT FOUND: $filePath"
    }
}
