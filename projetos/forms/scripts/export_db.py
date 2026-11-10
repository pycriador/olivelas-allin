import sqlite3
import json

con = sqlite3.connect('C:/Users/willi/Downloads/projetos/olivelas-gdrive-sync/data/gdrive_sync.db')
cur = con.cursor()
cur.execute('SELECT auth_mode, oauth_client_id, oauth_client_secret, oauth_tokens, service_account_json FROM settings WHERE id = 1')
row = cur.fetchone()

data = {
    'auth_mode': row[0],
    'oauth_client_id': row[1],
    'oauth_client_secret': row[2],
    'oauth_tokens': row[3],
    'service_account_json': row[4]
}

with open('scripts/gdrive_raw.json', 'w', encoding='utf-8') as f:
    json.dump(data, f)

print('Exported gdrive_raw.json successfully')
