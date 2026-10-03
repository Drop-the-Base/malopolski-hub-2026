import math
import re
from typing import List, Dict, Any, Tuple, Optional
from app.core.constants import strip_diacritics

# Słowa funkcyjne, które nie niosą znaczenia przy kojarzeniu
STOPWORDS = {
    "oraz", "jest", "sie", "nie", "dla", "przez", "jak", "ale", "lub", "czy", "ich", "jego", "jej", "tak",
    "ten", "tego", "tej", "tym", "przy", "nad", "pod", "bez", "aby", "zeby", "ktory", "ktora", "ktore",
    "ktorych", "naszej", "nasz", "nasza", "nasze", "moj", "moja", "moje", "mam", "maja", "jako", "takze",
    "rowniez", "bardzo", "tylko", "juz", "jeszcze", "sa", "byc", "jestem", "the", "and", "for", "with",
    "innowacja", "innowacji", "spoleczna", "spolecznej", "malopolska", "malopolski", "malopolsce",
    "gminy", "gminie", "gmina", "powiat", "powiecie", "osoby", "osob",
}

STEM_LENGTH = 6


def normalize_tokens(text: str) -> List[str]:
    """Małe litery, bez polskich znaków, tokeny >= 3 znaki, bez słów funkcyjnych."""
    text = strip_diacritics(text.lower())
    return [t for t in re.findall(r"[a-z0-9]{3,}", text) if t not in STOPWORDS]


def stem(token: str) -> str:
    """Prosty stemming przez obcięcie – wystarczający dla polskiej fleksji (samotnosc/samotne -> samotn)."""
    return token[:STEM_LENGTH]


def tokenize(text: str) -> List[str]:
    return [stem(t) for t in normalize_tokens(text)]


class SimpleHybridVectorStore:
    """
    Lekki indeks TF-IDF (cosinus) na rdzeniach słów, bez zewnętrznych zależności.
    Zwraca surowe podobieństwo 0..1 – kalibrację wyniku wykonuje serwis matchmakingu.
    """
    def __init__(self):
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.doc_vectors: Dict[str, Dict[str, float]] = {}
        self.idf: Dict[str, float] = {}

    def clear(self):
        self.documents.clear()
        self.doc_vectors.clear()
        self.idf.clear()

    def add_document(self, doc_id: str, content: str, metadata: Dict[str, Any]):
        self.documents[doc_id] = {
            "content": content,
            "tokens": tokenize(content),
            "metadata": metadata
        }
        self._recompute_index()

    def _recompute_index(self):
        total_docs = len(self.documents)
        if total_docs == 0:
            return

        df: Dict[str, int] = {}
        for doc in self.documents.values():
            for term in set(doc["tokens"]):
                df[term] = df.get(term, 0) + 1

        self.idf = {
            term: math.log((total_docs + 1) / (count + 1)) + 1.0
            for term, count in df.items()
        }

        for doc_id, doc in self.documents.items():
            self.doc_vectors[doc_id] = self._vectorize(doc["tokens"])

    def _vectorize(self, tokens: List[str]) -> Dict[str, float]:
        tf: Dict[str, int] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        vec = {t: (1.0 + math.log(c)) * self.idf.get(t, 1.0) for t, c in tf.items()}
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
        return {t: v / norm for t, v in vec.items()}

    def similarity(self, query: str) -> Tuple[Dict[str, float], Dict[str, List[str]]]:
        """Zwraca (doc_id -> cosinus, doc_id -> wspólne rdzenie) dla wszystkich dokumentów."""
        q_tokens = [t for t in tokenize(query) if t in self.idf]
        sims: Dict[str, float] = {}
        shared: Dict[str, List[str]] = {}
        if not q_tokens:
            return sims, shared
        q_vec = self._vectorize(q_tokens)
        for doc_id, d_vec in self.doc_vectors.items():
            common = [t for t in q_vec if t in d_vec]
            sims[doc_id] = sum(q_vec[t] * d_vec[t] for t in common)
            shared[doc_id] = common
        return sims, shared

    def search(self, query: str, top_k: int = 3, category_filter: Optional[str] = None) -> List[Tuple[str, float, Dict[str, Any]]]:
        sims, _ = self.similarity(query)
        results = [
            (doc_id, round(score, 3), self.documents[doc_id]["metadata"])
            for doc_id, score in sims.items()
            if score > 0 and (not category_filter or self.documents[doc_id]["metadata"].get("category") == category_filter)
        ]
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]


# Globalna instancja indeksu
vector_store = SimpleHybridVectorStore()
