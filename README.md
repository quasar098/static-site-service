# website thing for hosting websites for a class

yes

## env variables

#### required:

`JWT_SECRET` is a secret string that you keep to yourself

#### recommended:

`ALLOWED_IPS` is a json stringified list of ips that are ok

`ADMINS` is a list of {"username": __, "password": __} things stringified and the password is bcrypted with 10 rounds

`TITLE` is the website title
