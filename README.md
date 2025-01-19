# PeerLink

in server these are running:

* 8080 -> tracker
* 8081 -> postgres
* 8082 -> pgadmin
* 8083 -> elasticsearch
* 8084 -> kibana
* 80   -> server

Example search query to server in Postman:
```bash
GET http://144.122.71.171/search/?query=CENG382
```

## Client

Node modules management:

First, install distutils:
```bash
brew install python-setuptools
```

and when you need to `npm install` a new module which will be used in Electron side `cd` into `client/release/app` and install it there.
when you need to install a module that will be used in the React side `cd`` into `client` and install it there.


Install libextractor
```bash
brew install libextractor
```

to install these packages on Ubuntu, do `sudo apt install python3-distutils` and `sudo apt install libextractor-dev`

Install dependencies
```bash
    npm install
```

Run client
```bash
    npm start
```

This will open an electron  interface. Make sure you're connected to METU VPN (for now).


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

### Running Django app
```bash
    python3 manage.py runserver
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
