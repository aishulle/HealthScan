# backend/parser.py
import re
from typing import List, Optional
from pydantic import BaseModel

class LabRow(BaseModel):
    name: str
    value: float
    unit: str
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    status: str

class Report(BaseModel):
    rows: List[LabRow]

RANGES = {
    "HbA1c": ("%",       4.0,  5.6),
    "LDL":   ("mg/dL",   0,    130),
    "WBC":   ("10^3/uL", 4.0,  11.0),
    # ▸ add more ranges here …
}

def parse_lab_text(text: str) -> Report:
    rows: list[LabRow] = []

    # ① single-line “table” rows:  NAME  VALUE  UNIT  (easy)
    table_pattern = re.compile(r"^(\w[\w\s/%+-]+?)\s{2,}([\d.,]+)\s{2,}([^\s]+)", re.M)

    for name, value_raw, unit in table_pattern.findall(text):
        rows.append(_make_row(name.strip(), value_raw, unit))

    # ② fallback — triplets on separate lines
    if not rows:
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        for i in range(len(lines) - 2):
            name, value_raw, unit = lines[i : i + 3]
            if _is_number(value_raw):
                rows.append(_make_row(name, value_raw, unit))
                i += 2

    return Report(rows=rows)



def _is_number(s: str) -> bool:
    try:
        float(s.replace(",", ""))
        return True
    except ValueError:
        return False

def _make_row(name: str, value_raw: str, unit_in_text: str) -> LabRow:
    value = float(value_raw.replace(",", ""))
    unit_ref, low, high = RANGES.get(name, (unit_in_text, None, None))

    status = "normal"
    if low is not None and value < low:
        status = "low"
    elif high is not None and value > high:
        status = "high"

    return LabRow(
        name=name,
        value=value,
        unit=unit_ref or unit_in_text,
        ref_low=low,
        ref_high=high,
        status=status,
    )
