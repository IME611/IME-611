export class SemanticMatcherUnavailableError extends Error {
  constructor(message='Semantic matcher is not configured'){
    super(message);
    this.name='SemanticMatcherUnavailableError';
    this.code='SEMANTIC_MATCHER_UNAVAILABLE';
  }
}

/**
 * Runtime contract for future semantic/embedding providers.
 *
 * A provider implementation must return a provider-independent shape:
 * {
 *   available: true,
 *   provider: string,
 *   model: string,
 *   matches: [{ id: string, score: number, rationale?: string }]
 * }
 *
 * Scores must be normalized to [0,1]. The provider must never mutate
 * canonical concepts, candidates, or review state.
 */
export class SemanticMatcher {
  get available(){ return false; }
  get provider(){ return 'none'; }
  get model(){ return null; }

  async rank(){
    throw new SemanticMatcherUnavailableError();
  }
}

export const semanticMatcher=new SemanticMatcher();

export function semanticCapability(){
  return{
    available:semanticMatcher.available,
    provider:semanticMatcher.provider,
    model:semanticMatcher.model,
    requiredFor:['semantic-near-duplicate','synonym-resolution','paraphrase-equivalence'],
    fallback:'deterministic-lexical',
  };
}
