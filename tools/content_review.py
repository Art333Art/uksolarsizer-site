"""List guides older than a configurable number of days (default 365)."""
import re, sys
from datetime import date
from pathlib import Path

root = Path(__file__).resolve().parents[1]
days = int(sys.argv[1]) if len(sys.argv) > 1 else 365
for path in sorted(root.glob("**/index.html")):
    text = path.read_text(encoding="utf-8")
    match = re.search(r'"dateModified":"(\d{4}-\d{2}-\d{2})"', text)
    if match and (date.today() - date.fromisoformat(match.group(1))).days > days:
        print(f"{path.relative_to(root)}\tlast reviewed {match.group(1)}")
