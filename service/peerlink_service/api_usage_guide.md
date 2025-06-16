# API Usage Guide

## Base URL

`http://127.0.0.1:8000/`

or 

`http://localhost:8000/`

## Endpoints

### 1. Users

Manage users who upload or downlaod torrents

List all users
- Endpoint: `GET /users/`
- Description: Retrieve a list of all users
- Response example:
    ```json
    [
        {
            "id": "uuid",
            "username": "john_doe",
            "email": "john@example.com",
            "created_at": "2024-11-20T12:00:00Z"
        }
    ]
    ```
Add new user 
- Endpoint: `POST /users/`
- Description: Create a new user
- Request body example:
    ```json
    {
        "username": "john_doe",
        "email": "john@example.com"
    }
    ```
- Response example:
    ```json
    {
        "id": "uuid",
        "username": "john_doe",
        "email": "john@example.com",
        "created_at": "2024-11-20T12:00:00Z"
    }
    ```

### 2. Torrents

Manage shared torrents

List all torrents
- Endpoint: `GET /torrents/`
- Description: Retrieve a list of all torrents
- Response example:
    ```json
    [
        {
            "id": "uuid",
            "name": "ceng_111_cikmislar.pdf",
            "magnetLink": "magnet:?xt=urn:btih:12345",
            "uploaded_by": "john_doe",
            "uploaded_at": "2024-11-20T12:00:00Z"
        }
    ]
    ```

Search torrents by name
- Endpoint: `GET /torrents/?search={query}`
- Description: Search torrents by name
- Query parameter
    - `search`: part or full name (case insensitive) 
- Example
    ```
    GET /torrents/?search=111
    ```
- Response example:
    ```json
    [
        {
            "id": "uuid",
            "name": "ceng_111_cikmislar.pdf",
            "magnetLink": "magnet:?xt=urn:btih:12345",
            "uploaded_by": "john_doe",
            "uploaded_at": "2024-11-20T12:00:00Z"
        }
    ]
    ```

Add a new torrent
- Endpoint: `POST /torrents/`
- Description: Add a new torrent
- Request body example
    ```json
    {
        "name": "ceng_111_cikmislar.pdf",
        "magnetLink": "magnet:?xt=urn:btih:12345",
        "uploaded_by": "uuid"
    }
    ```
- Response example:
    ```json
    {
        "id": "uuid",
        "name": "ceng_111_cikmislar.pdf",
        "magnetLink": "magnet:?xt=urn:btih:12345",
        "uploaded_by": "john_doe",
        "uploaded_at": "2024-11-20T12:00:00Z"
    }
    ```


### 3. Downloads

Track torrent downloads by users

List all downloads
- Endpoint: `GET /downloads/`
- Description: Retrieve a list of all downloads
- Response example:
    ```json
    [
        {
            "id": "uuid",
            "name": "ceng_111_cikmislar.pdf",
            "user": "jane_smith",
            "download_at": "2024-11-20T12:00:00Z"
        }
    ]
    ```

Add a new download
- Endpoint: `POST /downloads/`
- Description: Add a new download record
- Request body example:
    ```json
    {
        "torrent": "uuid",
        "user": "uuid"
    }
    ```
- Response example:
    ```json
    {
        "id": "uuid",
        "name": "ceng_111_cikmislar.pdf",
        "user": "jane_smith",
        "download_at": "2024-11-20T12:00:00Z"
    }
    ```
## Error Responses
Endpoints return HTTP status codes for error: 
- 400 Bad Request: invalid or missing parameter
    - maybe search query problematic
- 404 Not Found:
- 500 Internal Server Error:
    - make sure django up and running

## Examples

- List torrents 
    ```bash
    curl -X GET http://127.0.0.1:8000/torrents/
    ```

- Search torrents 
    ```bash
    curl -X GET "http://127.0.0.1:8000/torrents/?search=111"
    ```

- Add a torrent 
    ```bash
    curl -X POST http://127.0.0.1:8000/torrents/ \
    -H "Content-Type: application/json" \
    -d '{"name": "ceng_111_cikmislar.pdf", "magnetLink": "magnet:?xt=urn:btih:12345", "uploaded_by": "user_uuid"}'
    ```

- Add a Download
    ```bash
    curl -X POST http://127.0.0.1:8000/downloads/ \
    -H "Content-Type: application/json" \
    -d '{"torrent": "torrent_uuid", "user": "user_uuid"}'
    ```
