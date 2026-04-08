import json
import os

file_path = r'c:\projets\my-ankece\constants\translations\fr.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Navigate to the specific key
# The structure is: { "academy": { "alerts": { ... } } }
if 'academy' in data and 'alerts' in data['academy']:
    data['academy']['alerts']['uploadSuccess'] = "Média mis en ligne avec succès !"
    data['academy']['alerts']['uploadError'] = "Erreur lors de la mise en ligne."
    data['academy']['alerts']['permissionDenied'] = "L'accès à la galerie est requis."

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Translations updated successfully.")
