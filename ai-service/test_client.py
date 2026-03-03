import requests
import sys
import os

def test_analysis(image_path):
    if not os.path.exists(image_path):
        print(f"Erreur : Le fichier {image_path} n'existe pas.")
        return

    url = "http://127.0.0.1:8000/analyze-shot"
    
    print(f"🚀 Envoi de {image_path} pour analyse...")
    
    with open(image_path, 'rb') as f:
        files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
        response = requests.post(url, files=files)

    if response.status_code == 200:
        result = response.json()
        print("\n✅ Analyse terminée !")
        
        if 'success' not in result:
            print("⚠️ Réponse inattendue (clé 'success' manquante) :")
            print(result)
            return

        print(f"Succès : {result['success']}")
        
        analysis = result.get('analysis', {})
        if result.get('type') == 'video' and analysis.get('success'):
            print(f"🎥 Vidéo analysée : {analysis.get('frame_count')} images au total.")
            print(f"📈 Séquence : {analysis.get('analyzed_frames')} images traitées.")
            print(f"🔥 Angle coude max : {analysis.get('max_elbow_angle')}°")
            print(f"❄️ Angle coude min : {analysis.get('min_elbow_angle')}°")
            print(f"🧍 Inclinaison buste moy : {analysis.get('avg_torso_lean', 'N/A')}°")
            
            if 'coaching_report' in analysis:
                print("\n🏀 CONSEILS DE COACHING :")
                for advice in analysis['coaching_report']:
                    print(f"  📢 {advice}")
            
            print("\nDonnées de séquence disponibles dans le JSON.")
        elif analysis.get('detected'):
            print(f"Message : {analysis['message']}")
            if 'pose_points' in analysis:
                print("\n📍 Points détectés (coordonnées normalisées 0-1) :")
                for point, coords in analysis['pose_points'].items():
                    print(f"  - {point}: x={coords[0]:.2f}, y={coords[1]:.2f}")
            if 'angles' in analysis:
                print("\n📐 Angles calculés :")
                for angle_name, value in analysis['angles'].items():
                    print(f"  - {angle_name}: {value}°")
        else:
            print(f"❌ Échec : {analysis.get('message', 'Erreur inconnue')}")
    else:
        print(f"❌ Erreur serveur : {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    # Si aucun argument, on demande le chemin
    if len(sys.argv) < 2:
        path = input("Entrez le chemin vers une image de vous (ex: photo.jpg) : ")
        test_analysis(path)
    else:
        test_analysis(sys.argv[1])
