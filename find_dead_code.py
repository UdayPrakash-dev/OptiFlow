import os
import re

def get_js_files(directory):
    js_files = []
    for root, _, files in os.walk(directory):
        for f in files:
            if f.endswith('.js') or f.endswith('.jsx') or f.endswith('.ts'):
                js_files.append(os.path.join(root, f))
    return js_files

def check_dead_code(directory):
    files = get_js_files(directory)
    contents = {}
    for f in files:
        with open(f, 'r', encoding='utf-8') as file:
            contents[f] = file.read()
    
    dead_files = []
    for f in files:
        # Ignore entry points
        if f.endswith('server.js') or f.endswith('main.jsx') or f.endswith('App.jsx') or f.endswith('index.jsx') or f.endswith('index.js'):
            continue
        
        basename = os.path.basename(f)
        name_no_ext = os.path.splitext(basename)[0]
        
        is_imported = False
        for other_f, content in contents.items():
            if other_f == f:
                continue
            if name_no_ext in content:
                is_imported = True
                break
        
        if not is_imported:
            dead_files.append(f)
            
    return dead_files

print("Dead code in back-end-new:", check_dead_code('back-end-new/src'))
print("Dead code in react_frontend:", check_dead_code('react_frontend/src'))
