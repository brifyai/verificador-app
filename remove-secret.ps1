$apiKey = "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"
$replacement = ""

git filter-branch --force --tree-filter "if (Test-Path 'app/data/api_providers.json') { (Get-Content 'app/data/api_providers.json' -Raw) -replace [regex]::Escape($apiKey), $replacement | Set-Content 'app/data/api_providers.json' }" --prune-empty --tag-name-filter cat -- --all
