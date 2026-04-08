import urllib.request
url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Basketball_player_silhouette.svg/512px-Basketball_player_silhouette.svg.png'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req) as response, open('assets/images/mock-player.png', 'wb') as out_file:
    out_file.write(response.read())
print("Downloaded successfully.")
