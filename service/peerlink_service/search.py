from elasticsearch import Elasticsearch
from .constants import *

client = Elasticsearch(hosts=ELASTICSEARCH_URL)
client.indices.refresh(index=FILES_INDEX)


def index_file(metadata):
    # we put magnetLink as _id in elasticsearch because it's unique and when we try to index the same magnetLink
    # again it will update the existent entry instead of creating a new one.
    magnet_link = metadata.get("magnetLink")
    metadata.pop("magnetLink")

    resp = client.index(
        index=FILES_INDEX,
        document=metadata,
        id=magnet_link
    )

    print(resp)
    return resp


def search_file(search_term):
    """
    searches for `search_term` in all metadata fields
    returns magnets link and all related metadata
    """
    resp = client.search(
        index=FILES_INDEX,
        query={
            "query_string": {
                "query": f"*{search_term}*",
                "fields": ["*"],
                "analyze_wildcard": True
            }
        }
    )

    for hit in resp["hits"]["hits"]:
        print(hit)

    return [{ **hit["_source"], "magnet_link": hit["_id"] } for hit in resp["hits"]["hits"]]
