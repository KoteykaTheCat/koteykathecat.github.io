import json
import re
from pathlib import Path


INPUT_FILE = "dreams.txt"
OUTPUT_FOLDER = r"dreams_test"



MONTHS = {
	"января": 1, "февраля": 2, "марта": 3, "апреля": 4,
	"мая": 5, "июня": 6, "июля": 7, "августа": 8,
	"сентября": 9, "октября": 10, "ноября": 11, "декабря": 12,
}

DATE_RE = re.compile(
	r"^\s*(\d{1,2})\s+(" + "|".join(MONTHS) + r")\s+(\d{4})\s*$",
	re.IGNORECASE,
	)


def parse_entries(lines):
	"""Делит строки файла на записи: начало записи — строка с датой."""
	entries = []
	current = None
	for line in lines:
		if DATE_RE.match(line):
			current = [line]
			entries.append(current)
		elif current is not None:
			current.append(line)
	return entries


def build_entry(block):
	"""Превращает блок строк в (имя_файла_без_расширения, словарь)."""
	m = DATE_RE.match(block[0])
	day, month_name, year = int(m.group(1)), m.group(2).lower(), int(m.group(3))
	date_text = f"{day} {month_name} {year}"
	iso = f"{year:04d}-{MONTHS[month_name]:02d}-{day:02d}"

	rest = block[1:]
	title = rest[0].strip() if len(rest) > 0 else ""
	tags_line = rest[1].strip() if len(rest) > 1 else ""
	text_lines = rest[2:]

	# убираем пустые строки в конце (разделитель между записями)
	while text_lines and not text_lines[-1].strip():
		text_lines.pop()

	tags = [t for t in re.split(r"[\s,]+", tags_line) if t]
	text = "<br>".join(line.rstrip() for line in text_lines)

	data = {"title": title, "date": date_text}
	if tags:
		data["tags"] = tags
	data["text"] = text
	return iso, data


def main():
	src = Path(INPUT_FILE)
	if not src.is_file():
		print(f"Файл не найден: {src}")
		return

	lines = src.read_text(encoding="utf-8-sig").splitlines()
	entries = parse_entries(lines)
	if not entries:
		print("Не найдено ни одной записи с датой.")
		return

	out_dir = Path(OUTPUT_FOLDER)
	out_dir.mkdir(parents=True, exist_ok=True)

	used = {}  # iso-дата -> сколько раз уже встречалась
	for block in entries:
		iso, data = build_entry(block)
		used[iso] = used.get(iso, 0) + 1
		name = iso if used[iso] == 1 else f"{iso}-{used[iso]}"

		path = out_dir / f"{name}.json"
		path.write_text(
			json.dumps(data, ensure_ascii=False, indent=4) + "\n",
			encoding="utf-8",
			)
		print(f"[СОЗДАН] {path.name}")

	print(f"\nГотово. Записей: {len(entries)}, папка: {out_dir.resolve()}")


if __name__ == "__main__":
	main()