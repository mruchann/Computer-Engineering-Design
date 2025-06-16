# PeerLink

in server these are running:

* 8080 -> tracker
* 8081 -> postgres
* 8082 -> pgadmin
* 8083 -> elasticsearch
* 8084 -> kibana
* 80   -> server

## Notes for frontend:

1. Run `npm install` in the `client` directory.
2. Run `npm run dev` in the `client` directory to start the application.
3. `client/renderer/components/AuthGuard.tsx`, `client/renderer/store/useAuthStore.ts`, and `client/renderer/store/useStore.ts` are related to authentication. If page redirection is not happening due to authentication, change these files.
4. `client/main/config.ts` and `client/renderer/constants/api.ts` store API endpoint constants. If you want to test your local changes, change the constants to point to the local server, otherwise point them to the server running on `144.122.71.171`.

## Notes for backend:

1. Run `pip install -r requirements.txt` in the `service` directory.
2. Run `python manage.py runserver 8000` in the `service` directory to start the server. 8000 is for the port being used.


Example search query to server in Postman:
```bash
GET http://144.122.71.171/api/search/?query=CENG382
```

## Service

### For python venv

```bash
    python3 -m venv venv
```

```bash
    source venv/bin/activate
```

You may want to use the following command to install requirements for python packages
```bash
    pip install -r requirements.txt
```

For quitting
```bash
    deactivate
```

### Migrations For DB

Make it inside venv

```bash
    python3 manage.py makemigrations
    python3 manage.py migrate 
```

## Tracker

After ssh to peerlink server

```bash
    nohup bittorrent-tracker --ws --port 8080 &
```


### To try out newly developed stuff:
```
python manage.py shell

>>> from peerlink_service.models import *
>>> user1 = User.objects.create_user(username="username", email="email", password="pass")
>>> group1 = Group.objects.create(name="group_name", description="group_description")
>>> Membership.objects.create(user=user1, group=group1)
>>> user1.groups.all()
<QuerySet [<Group: Developers>]>
>>> group1.members.all()
<QuerySet [<User: username email>]>
```

### To run backend locally on MAC:

```
brew install postgresql
```