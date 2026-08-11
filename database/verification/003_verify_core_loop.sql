-- Core-loop integrity checks. Each violation query must return zero rows.
-- Supported insights without any provenance edge.
SELECT i.id FROM insights i LEFT JOIN provenance_edges p ON p.derived_entity_type='INSIGHT' AND p.derived_entity_id=i.id WHERE i.status='SUPPORTED' GROUP BY i.id HAVING COUNT(p.id)=0;

-- Insight -> Claim edges whose claim has no evidence.
SELECT DISTINCT p.derived_entity_id AS insight_id,p.source_entity_id AS claim_id
FROM provenance_edges p LEFT JOIN evidence e ON e.claim_id=p.source_entity_id
WHERE p.derived_entity_type='INSIGHT' AND p.source_entity_type='CLAIM' AND e.id IS NULL;

-- Evidence detached from a canonical fragment/source (should also be prevented by FKs).
SELECT e.id FROM evidence e LEFT JOIN source_fragments f ON f.id=e.fragment_id LEFT JOIN sources s ON s.id=f.source_id WHERE f.id IS NULL OR s.id IS NULL;

-- Experiments whose insight cannot be traced to evidence.
SELECT x.id AS experiment_id FROM experiments x
WHERE NOT EXISTS (
 SELECT 1 FROM provenance_edges p JOIN evidence e ON e.claim_id=p.source_entity_id JOIN source_fragments f ON f.id=e.fragment_id JOIN sources s ON s.id=f.source_id
 WHERE p.derived_entity_type='INSIGHT' AND p.derived_entity_id=x.insight_id AND p.source_entity_type='CLAIM'
);

-- Transformation summary.
SELECT
 (SELECT COUNT(*) FROM sources) sources,
 (SELECT COUNT(*) FROM source_fragments) fragments,
 (SELECT COUNT(*) FROM claims) claims,
 (SELECT COUNT(*) FROM evidence) evidence,
 (SELECT COUNT(*) FROM insights) insights,
 (SELECT COUNT(*) FROM experiments) experiments,
 (SELECT COUNT(*) FROM reflections) reflections;
