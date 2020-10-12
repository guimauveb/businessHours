CREATE TABLE days(
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    Day varchar(127),
    Open boolean,
    PRIMARY KEY (id)
);

INSERT INTO days (Day, Open)
VALUES ("monday", FALSE),
("tuesday", TRUE),
("wednesday", TRUE),
("thursday", TRUE),
("friday", TRUE),
("saturday", TRUE),
("sunday", FALSE);

CREATE TABLE monday(
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    OpenH MEDIUMINT,
    CloseH MEDIUMINT,
    PRIMARY KEY (id)
);

CREATE TABLE tuesday(
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    OpenH MEDIUMINT,
    CloseH MEDIUMINT,
    PRIMARY KEY (id)
);

CREATE TABLE wednesday(
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    OpenH MEDIUMINT,
    CloseH MEDIUMINT,
    PRIMARY KEY (id)
);

CREATE TABLE thursday(
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    OpenH MEDIUMINT,
    CloseH MEDIUMINT,
    PRIMARY KEY (id)
);
CREATE TABLE friday(
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    OpenH MEDIUMINT,
    CloseH MEDIUMINT,
    PRIMARY KEY (id)
);
CREATE TABLE saturday(
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    OpenH MEDIUMINT,
    CloseH MEDIUMINT,
    PRIMARY KEY (id)
);

CREATE TABLE sunday(
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    OpenH MEDIUMINT, 
    CloseH MEDIUMINT,
    PRIMARY KEY (id)
);

INSERT INTO sunday (OpenH, CloseH)
VALUES (570, 720);

INSERT INTO monday (OpenH, CloseH)
VALUES (2010, 2160);

INSERT INTO tuesday (OpenH, CloseH)
VALUES (3450, 3600);

INSERT INTO wednesday (OpenH, CloseH)
VALUES (4450, 4600);

INSERT INTO thursday (OpenH, CloseH)
VALUES (5450, 5600);

INSERT INTO friday (OpenH, CloseH)
VALUES (6450, 6600);

INSERT INTO saturday (OpenH, CloseH)
VALUES (7450, 7600);

CREATE TABLE holidays(
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    day varchar(127),
    status boolean, 
    PRIMARY KEY (id)
);

INSERT INTO holidays VALUES 
(0, "holidays", TRUE),
(1, "monday", FALSE),
(2, "tuesday", TRUE),
(3, "wednesday", TRUE),
(4, "thursday", TRUE),
(5, "friday", TRUE),
(6, "saturday", TRUE),
(7, "sunday", FALSE);

