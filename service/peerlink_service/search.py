from elasticsearch import Elasticsearch
from .constants import *

client = Elasticsearch(hosts=ELASTICSEARCH_URL)
client.indices.refresh(index=FILES_INDEX)


def index_file(metadata):
    # we put magnetLink as _id in elasticsearch because it's unique and when we try to index the same magnetLink
    # again it will update the existent entry instead of creating a new one.
    magnetLink = metadata.get("magnetLink")
    metadata.pop("magnetLink")

    resp = client.index(
        index=FILES_INDEX,
        document=metadata,
        id=magnetLink
    )

    print(resp)
    return resp


def update_file(magnetLink, update_fields):
    update_body = {
        "doc": update_fields,
        "doc_as_upsert": True,
    }

    response = es.update(index=FILES_INDEX, id=magnetLink, body=update_body)

    return response


def search_file(search_term, allowed_file_hashes, search_by_metadata):
    """
    searches for `search_term` in all metadata fields
    returns magnet links and all related metadata
    """
    if not search_term:
        resp = client.search(
            index=FILES_INDEX,
            body={
                "query": {
                    "bool": {
                        "filter": [
                            {
                                "terms": {
                                    "hash": list(allowed_file_hashes)
                                }
                            }
                        ]
                    }
                }
            },
            size=ELASTICSEARCH_MAX_RESULTS
        )
    else:
        # We choose the files that the current user has access to
        print("here", allowed_file_hashes)
        resp = client.search(
            index=FILES_INDEX,
            body={
                "query": {
                    "bool": {
                        "should": [
                            {
                                "simple_query_string": {
                                    "query": f"*{search_term}*",
                                    "fields": [ search_by_metadata ],
                                    "analyze_wildcard": True,
                                    "default_operator": "AND",
                                }
                            },
                        ],
                        "minimum_should_match": 1,
                        "filter": [
                            {
                                "terms": {
                                    "hash": list(allowed_file_hashes)
                                }
                            }
                        ]
                    }
                }
            },
            size=ELASTICSEARCH_MAX_RESULTS
        )

    # If you want to search via web interface localhost,
    # Comment out above and use below

    # resp = client.search(
    #     index=FILES_INDEX,
    #     query={
    #         "query_string": {
    #             "query": f"*{search_term}*",
    #             "fields": [ "*" ],
    #             "analyze_wildcard": True
    #         }
    #     }
    # )

    # for hit in resp["hits"]["hits"]:
    #    print(hit)

    return [{ **hit["_source"], "magnetLink": hit["_id"]} for hit in resp["hits"]["hits"]]
