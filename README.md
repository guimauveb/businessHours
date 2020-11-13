# Business Hours Manager

![Business Hours Manager](/imgs/screenshot.jpg)

A javascript application made to dynamically manage business hours, typically for a shop owner.

To avoid multiple connections to the database while modifying the hours, every change is stored locally in a JSON variable which is then sent to the server only when 'Apply' is clicked.

### Here is a [Live version](https://guimauveb.com/projects/businessHours)

## Features
    - Hours can be displayed in 24h or 12h format
    - Hours are stored on a MySQL database
    - Overlapping hours are visually signaled and kept from being uploaded
    - An 'Holiday mode' allows the user to set all days to 'Closed for business'


## Installation:

1. Clone this repo
2. Create a Python virtual environment using virtualenv
3. From the source folder, install the required dependencies using the following command:
```
    $ pip install -r requirements.txt
```
4. Create the required databases using the commands in **db/hours.sql**
5. From the source folder export the following variables:
```
    $ export FLASK_APP="application.py"
    $ export FLASK_DEBUG=1
    $ export FLASK_RUN_PORT=8080
```
6. Run a local server from the source folder
```
    $ python -m flask run
```


## Improvements to be made
    - Limit fetch() calls to a strict minimum
    - Better signaling of overlapping hours
    - Code needs some cleanup


