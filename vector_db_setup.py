import chromadb
from sentence_transformers import SentenceTransformer
import json
import os

# Initialize embedding model
print("Loading embedding model...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')
print("[OK] Embedding model loaded")

# Initialize ChromaDB client (NEW API - no Settings needed)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Create or get collection
collection_name = "government_contracts"
try:
    collection = chroma_client.get_collection(name=collection_name)
    print(f"[OK] Using existing collection: {collection_name}")
except:
    collection = chroma_client.create_collection(name=collection_name)
    print(f"[OK] Created new collection: {collection_name}")

def initialize_vector_db():
    """Load annotated examples into vector database"""
    
    # Load annotated examples
    examples_file = "annotated_examples.json"
    
    if not os.path.exists(examples_file):
        print(f"[ERROR] Error: {examples_file} not found!")
        return False

    with open(examples_file, 'r') as f:
        data = json.load(f)

    examples = data.get('examples', [])

    if not examples:
        print("[ERROR] No examples found in JSON!")
        return False
    
    print(f"Loading {len(examples)} annotated examples...")
    
    # Clear existing data (optional - comment out if you want to keep old data)
    try:
        chroma_client.delete_collection(name=collection_name)
        collection = chroma_client.create_collection(name=collection_name)
        print("[OK] Cleared old data")
    except:
        pass
    
    # Add each example to the collection
    for idx, example in enumerate(examples):
        # Generate embedding for the problematic section
        text = example['problematic_section']
        embedding = embedder.encode(text).tolist()
        
        # Prepare metadata
        metadata = {
            'id': example['id'],
            'issue_type': example['issue_type'],
            'severity': example['severity'],
            'explanation': example['explanation'],
            'actual_outcome': example['actual_outcome'],
            'estimated_cost': example['estimated_cost'],
            'correct_version': example['correct_version'],
            'contract_source': example['contract_source']
        }
        
        # Add to collection
        collection.add(
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata],
            ids=[f"example_{idx}"]
        )
        
        if (idx + 1) % 5 == 0:
            print(f"  Loaded {idx + 1}/{len(examples)} examples...")
    
    print(f"[OK] Successfully loaded {len(examples)} examples into vector DB")
    return True

def search_similar_patterns(query_text, n_results=3):
    """Search for similar patterns in the vector database"""

    # Get or create collection
    try:
        coll = chroma_client.get_collection(name=collection_name)
    except Exception as e:
        print(f"[WARNING] Collection not found: {e}")
        print(f"   Run 'python vector_db_setup.py' first to initialize")
        return []

    # Generate embedding for query
    query_embedding = embedder.encode(query_text).tolist()

    # Search in collection
    results = coll.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    # Format results to match expected structure
    formatted_results = []
    if results and results['ids'] and len(results['ids'][0]) > 0:
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'id': results['ids'][0][i],
                'problematic_section': results['documents'][0][i],
                'similarity_score': 1 - results['distances'][0][i],  # Convert distance to similarity
                'issue_type': results['metadatas'][0][i]['issue_type'],
                'severity': results['metadatas'][0][i]['severity'],
                'explanation': results['metadatas'][0][i]['explanation'],
                'actual_outcome': results['metadatas'][0][i]['actual_outcome'],
                'estimated_cost': results['metadatas'][0][i]['estimated_cost'],
                'correct_version': results['metadatas'][0][i]['correct_version'],
                'contract_source': results['metadatas'][0][i]['contract_source']
            })

    return formatted_results

def get_collection_stats():
    """Get statistics about the collection"""
    try:
        count = collection.count()
        return {
            'total_examples': count,
            'collection_name': collection_name
        }
    except Exception as e:
        return {'error': str(e)}