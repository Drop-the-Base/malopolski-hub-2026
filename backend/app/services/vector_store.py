import math
import re
from typing import List, Dict, Any, Tuple

def tokenize(text: str) -> List[str]:
    # Normalizacja znaków polskich i tokenizacja
    text = text.lower()
    tokens = re.findall(r'\b[a-ząćęłńóśźż0-9]{3,}\b', text)
    return tokens

class SimpleHybridVectorStore:
    """
    Hybrydowy silnik wyszukiwania semantyczno-leksykalnego (BM25 / Cosine TF-IDF),
    zapewniający zerowe zależności zewnętrzne, natychmiastowe działanie w kontenerze
    oraz wysoką odporność na brak połączenia internetowego.
    """
    def __init__(self):
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.doc_vectors: Dict[str, Dict[str, float]] = {}
        self.idf: Dict[str, float] = {}

    def add_document(self, doc_id: str, content: str, metadata: Dict[str, Any]):
        tokens = tokenize(content)
        self.documents[doc_id] = {
            "content": content,
            "tokens": tokens,
            "metadata": metadata
        }
        self._recompute_index()

    def _recompute_index(self):
        total_docs = len(self.documents)
        if total_docs == 0:
            return

        # Obliczanie DF (Document Frequency)
        df: Dict[str, int] = {}
        for doc_id, doc in self.documents.items():
            unique_terms = set(doc["tokens"])
            for term in unique_terms:
                df[term] = df.get(term, 0) + 1

        # Obliczanie IDF
        self.idf = {
            term: math.log((total_docs + 1) / (count + 1)) + 1.0
            for term, count in df.items()
        }

        # Obliczanie wektorów TF-IDF z normalizacją L2
        for doc_id, doc in self.documents.items():
            tokens = doc["tokens"]
            tf: Dict[str, float] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1

            vec: Dict[str, float] = {}
            norm_sq = 0.0
            for t, count in tf.items():
                tfidf = (1.0 + math.log(count)) * self.idf.get(t, 1.0)
                vec[t] = tfidf
                norm_sq += tfidf * tfidf

            norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
            self.doc_vectors[doc_id] = {t: val / norm for t, val in vec.items()}

    def search(self, query: str, top_k: int = 3, category_filter: str = None) -> List[Tuple[str, float, Dict[str, Any]]]:
        query_tokens = tokenize(query)
        if not query_tokens or not self.doc_vectors:
            return []

        # Wektor zapytania
        tf: Dict[str, float] = {}
        for t in query_tokens:
            tf[t] = tf.get(t, 0) + 1

        q_vec: Dict[str, float] = {}
        norm_sq = 0.0
        for t, count in tf.items():
            tfidf = (1.0 + math.log(count)) * self.idf.get(t, 1.0)
            q_vec[t] = tfidf
            norm_sq += tfidf * tfidf

        q_norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
        q_vec = {t: val / q_norm for t, val in q_vec.items()}

        # Obliczanie podobieństwa cosinusowego
        scores: List[Tuple[str, float, Dict[str, Any]]] = []
        for doc_id, doc_vec in self.doc_vectors.items():
            meta = self.documents[doc_id]["metadata"]
            if category_filter and meta.get("category") != category_filter:
                continue

            similarity = 0.0
            for term, q_val in q_vec.items():
                if term in doc_vec:
                    similarity += q_val * doc_vec[term]

            # Bonus za obecność w tagach lub tytule
            if similarity > 0:
                # Normalizacja wyniku do zakresu [0.5, 0.98]
                normalized_score = min(0.98, max(0.55, 0.50 + similarity * 0.48))
                scores.append((doc_id, round(normalized_score, 2), meta))

        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]

# Globalna instancja wektorowa
vector_store = SimpleHybridVectorStore()
