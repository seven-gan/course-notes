import io, re, os, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
# 找「问句里出现的 python 块后面没有 output」的既有惯例
for root, d, fs in os.walk("."):
    for f in fs:
        if not f.endswith(".md"):
            continue
        p = os.path.join(root, f)
        lines = io.open(p, encoding="utf-8").read().split("\n")
        py = [i for i,l in enumerate(lines) if re.match(r"^\s*```python\s*$", l)]
        ou = [i for i,l in enumerate(lines) if re.match(r"^\s*```output\s*$", l)]
        for i, pi in enumerate(py):
            nxt = py[i+1] if i+1 < len(py) else 10**9
            if not [o for o in ou if pi < o < nxt]:
                print(p.replace(os.sep,"/"), pi+1, "|", lines[pi+1][:60])
