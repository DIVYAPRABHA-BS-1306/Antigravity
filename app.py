import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup
from flask import Flask, render_template, jsonify

app = Flask(__name__)

# Route for frontend
@app.route('/')
def index():
    return render_template('index.html')

# API Route to fetch and parse release notes
@app.route('/api/release-notes')
def get_release_notes():
    try:
        url = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Parse XML
        # Atom namespaces
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(response.content)
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            date_str = title.text if title is not None else 'Unknown Date'
            
            updated = entry.find('atom:updated', ns)
            updated_str = updated.text if updated is not None else ''
            
            link = entry.find("atom:link[@rel='alternate']", ns)
            if link is None:
                link = entry.find('atom:link', ns)
            link_href = link.attrib.get('href', '') if link is not None else ''
            
            content = entry.find('atom:content', ns)
            content_html = content.text if content is not None else ''
            
            # Parse individual updates inside content
            soup = BeautifulSoup(content_html, 'html.parser')
            h3_tags = soup.find_all('h3')
            
            # If there are no h3 tags, we take the whole content
            if not h3_tags:
                text_str = soup.get_text(separator=' ').strip()
                text_str = " ".join(text_str.split())
                entry_id = entry.find('atom:id', ns).text if entry.find('atom:id', ns) is not None else ''
                entries.append({
                    'id': entry_id,
                    'date': date_str,
                    'updated': updated_str,
                    'link': link_href,
                    'type': 'Update',
                    'html': content_html,
                    'text': text_str
                })
            else:
                for idx, h3 in enumerate(h3_tags):
                    update_type = h3.get_text().strip()
                    
                    # Gather siblings until next h3
                    sibling_strs = []
                    curr = h3.next_sibling
                    while curr and curr.name != 'h3':
                        sibling_strs.append(str(curr))
                        curr = curr.next_sibling
                    
                    sub_html = "".join(sibling_strs).strip()
                    sub_soup = BeautifulSoup(sub_html, 'html.parser')
                    sub_text = sub_soup.get_text(separator=' ').strip()
                    sub_text = " ".join(sub_text.split())
                    
                    # Create a unique ID for each sub-update to allow selecting
                    entry_id = entry.find('atom:id', ns).text if entry.find('atom:id', ns) is not None else ''
                    unique_id = f"{entry_id}_{idx}"
                    
                    entries.append({
                        'id': unique_id,
                        'date': date_str,
                        'updated': updated_str,
                        'link': link_href,
                        'type': update_type,
                        'html': sub_html,
                        'text': sub_text
                    })
        
        return jsonify({
            'success': True,
            'entries': entries
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
