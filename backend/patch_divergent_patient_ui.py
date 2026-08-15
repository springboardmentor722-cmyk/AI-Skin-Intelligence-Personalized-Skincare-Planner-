from pathlib import Path
import re

FILES = {
    'PhotoUpload.js': '/home/ubuntu/upload/pasted_file_GF0kFu_PhotoUpload.js',
    'AiAnalysis.js': '/home/ubuntu/upload/pasted_file_Xpiim6_AiAnalysis.js',
}

for name, source_path in FILES.items():
    src = Path(source_path).read_text(encoding='utf-8')
    marker = "import api from '../services/api';"
    if "PatientSidebar" not in src and marker in src:
        src = src.replace(marker, marker + "\nimport PatientSidebar from '../components/PatientSidebar';\nimport '../styles/patient-theme.css';", 1)

    src = re.sub(r"\n  const mainMenu = \[.*?\n  \];", "\n  const mainMenu = [];", src, flags=re.S)

    patterns = [
        r"      <div style=\{\{\.\.\.styles\.sidebar, width: sidebarOpen \? '[^']+' : '[^']+'\}\}>.*?      </div>\n\n      <button style=\{\{\.\.\.styles\.toggleBtn",
        r"      <div style=\{styles\.sidebar\}>.*?      </div>\n\n      <button style=\{\{\.\.\.styles\.toggleBtn",
    ]
    for pattern in patterns:
        while True:
            match = re.search(pattern, src, flags=re.S)
            if not match:
                break
            replacement = """      <PatientSidebar\n        open={sidebarOpen}\n        onToggle={() => setSidebarOpen(!sidebarOpen)}\n      />\n\n      <button style={{...styles.toggleBtn"""
            src = src[:match.start()] + replacement + src[match.end():]

    src = re.sub(r"<div style=\{\{\.\.\.styles\.mainContent, marginLeft: sidebarOpen \? '[^']+' : '[^']+'\}\}>", "<main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>", src)
    src = src.replace("      </div>\n    </div>\n  );\n}\n\nconst styles", "      </main>\n    </div>\n  );\n}\n\nconst styles", 1)

    src = src.replace("backgroundColor: '#F8F9FC'", "backgroundColor: '#F5F7FB'")
    src = src.replace("backgroundColor: '#FFFFFF', borderRight: '1px solid #E5E7EB'", "backgroundColor: '#17233C', borderRight: '1px solid #263B63'")
    src = src.replace("backgroundColor: '#6C5CE7', color: '#FFFFFF'", "backgroundColor: '#E8E7FF', color: '#17233C'")
    src = src.replace("color: '#6B7280'", "color: '#778198'")
    src = src.replace("color: '#1F2937'", "color: '#17233C'")

    out = Path('/home/ubuntu/patient_ui') / f'{Path(name).stem}.updated.js'
    out.write_text(src, encoding='utf-8')
    print(name, 'sidebar=', src.count('PatientSidebar'), 'main=', src.count('<main className'))
