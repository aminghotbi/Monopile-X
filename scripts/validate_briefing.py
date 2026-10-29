"""Validate a briefing before publication. Python standard library only."""
import json
import sys
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

def validate(data):
    today = datetime.now(ZoneInfo('Australia/Sydney')).date()
    assert data['schema_version'] == 1
    assert data['timezone'] == 'Australia/Sydney'
    for field in ('updated_at', 'last_checked_at'):
        stamp = datetime.fromisoformat(data[field])
        assert stamp.utcoffset() is not None, 'Timestamp requires an offset'
        assert stamp.date() <= today, 'Future timestamp'
    assert isinstance(data['issues'], list) and data['issues'], 'No editions'
    ids = set()
    last_date = date.max
    for issue in data['issues']:
        day = date.fromisoformat(issue['date'])
        assert issue['id'] == issue['date'] and issue['id'] not in ids, 'Duplicate/invalid edition'
        assert day <= today and day <= last_date, 'Future edition or incorrect ordering'
        assert date.fromisoformat(issue['period_start']) <= date.fromisoformat(issue['period_end']) <= day
        ids.add(issue['id'])
        last_date = day
        for field in ('headline', 'intro', 'takeaway'):
            assert isinstance(issue[field], str) and issue[field].strip(), field
        assert isinstance(issue['items'], list) and len(issue['items']) <= 8
        item_ids, urls = set(), set()
        for item in issue['items']:
            for field in ('id', 'topic', 'title', 'summary', 'implication'):
                assert isinstance(item[field], str) and item[field].strip(), field
            assert item['id'] not in item_ids, 'Duplicate story'
            item_ids.add(item['id'])
            assert item['category'] in ('industry', 'research', 'context')
            source = item['source']
            assert source['date_type'] in ('published', 'issue', 'checked')
            assert date.fromisoformat(source['date']) <= day, 'Future source date'
            if item['category'] == 'industry':
                assert source['date_type'] == 'published', 'Industry news needs publication date'
                assert date.fromisoformat(issue['period_start']) <= date.fromisoformat(source['date']) <= date.fromisoformat(issue['period_end']), 'Older industry item belongs in context'
            for field in ('name', 'access_note'):
                assert isinstance(source[field], str) and source[field].strip(), field
            url = urlparse(source['url'])
            assert url.scheme == 'https' and url.hostname and not url.username and not url.password, 'Invalid URL'
            assert source['url'] not in urls, 'Duplicate source in edition'
            urls.add(source['url'])
    return len(data['issues'])

if __name__ == '__main__':
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'data/briefings.json'
    count = validate(json.loads(path.read_text()))
    print(f'Briefing validation passed: {count} edition(s).')
