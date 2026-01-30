import re

file_path = '/Users/zaher/Baraka2/barakah_life_management/src/constants/actionDefinitions.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
modified_count = 0

for line in lines:
    # Check if line has 'icon:' but not 'iconName:' (to avoid double insertion)
    if 'icon:' in line and 'iconName:' not in line:
        # Regex to find 'icon: IconName'
        # Handles optional trailing comma or closing brace
        match = re.search(r'icon:\s*([A-Za-z0-9_]+)', line)
        if match:
            icon_name = match.group(1)
            # Avoid replacing keys like 'icon_color' if any exist (though unlikely near 'icon:')
            # Use strict replacement
            old_str = f'icon: {icon_name}'
            new_str = f'icon: {icon_name}, iconName: \'{icon_name}\''
            line = line.replace(old_str, new_str)
            modified_count += 1
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Updated {modified_count} lines in actionDefinitions.ts")
