from collections import Counter


def recommend_top_items(order_history: list[list[int]], top_k: int = 5) -> list[int]:
    if not order_history:
        return []
    counts = Counter(item_id for order in order_history for item_id in order)
    return [item_id for item_id, _ in counts.most_common(top_k)]


def build_simple_model(order_history: list[list[int]]):
    try:
        from sklearn.feature_extraction import DictVectorizer
        from sklearn.neighbors import NearestNeighbors
    except Exception:
        return None

    if not order_history:
        return None

    rows = []
    for order in order_history:
        row = {}
        for item_id in order:
            row[str(item_id)] = row.get(str(item_id), 0) + 1
        rows.append(row)

    vectorizer = DictVectorizer(sparse=True)
    matrix = vectorizer.fit_transform(rows)

    model = NearestNeighbors(metric="cosine", algorithm="brute")
    model.fit(matrix)
    return {"model": model, "vectorizer": vectorizer}
