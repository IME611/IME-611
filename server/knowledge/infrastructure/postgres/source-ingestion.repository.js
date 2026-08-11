export class PostgresSourceIngestionRepository {
  constructor(db) { this.db = db; }

  async findByContentHash(contentHash) {
    const result = await this.db.query(
      `SELECT id, type::text AS type, title, author, original_uri, mime_type,
              content_hash, created_at
       FROM sources WHERE content_hash = $1 LIMIT 1`,
      [contentHash],
    );
    return result.rows[0] ?? null;
  }

  async insertSource(source) {
    const result = await this.db.query(
      `INSERT INTO sources(type,title,author,original_uri,mime_type,raw_content,content_hash,metadata)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id,type::text AS type,title,author,original_uri,mime_type,content_hash,created_at`,
      [source.type, source.title, source.author, source.originalUri || null,
       source.mimeType, source.rawContent, source.contentHash, source.metadata || {}],
    );
    return result.rows[0];
  }

  async insertFragments(sourceId, fragments) {
    const rows = [];
    for (const fragment of fragments) {
      const result = await this.db.query(
        `INSERT INTO source_fragments(
           source_id,fragmenter_version,ordinal,fragment_key,content_hash,raw_text,start_offset,end_offset,metadata
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id,ordinal,fragment_key,content_hash,start_offset,end_offset`,
        [sourceId, fragment.fragmenterVersion, fragment.ordinal, fragment.fragmentKey,
         fragment.contentHash, fragment.rawText, fragment.startOffset, fragment.endOffset, {}],
      );
      rows.push(result.rows[0]);
    }
    return rows;
  }

  async getFragments(sourceId) {
    const result = await this.db.query(
      `SELECT id,ordinal,fragmenter_version,fragment_key,content_hash,raw_text,start_offset,end_offset
       FROM source_fragments WHERE source_id=$1 ORDER BY ordinal`,
      [sourceId],
    );
    return result.rows;
  }
}
