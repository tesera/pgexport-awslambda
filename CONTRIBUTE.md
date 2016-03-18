# Contributing

This library uses [pg-native](https://github.com/brianc/node-pg-native) to leverage direct access to streams and copy.
In order to build a static libpq follow the steps below. postgres-devel package was avoided on purpose in order to 
create a minimal set of dependencies and ensure the process can be replicated for any version. All steps should be performed 
on Amazon AWS AMI using nvm and [AWS Lambda version of node](http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html).

- Download PostgreSQL source: ```wget https://ftp.postgresql.org/pub/source/v9.4.1/postgresql-9.4.1.tar.bz2```
- Extract it to downloaded location: ```tar xjf ~/Downloads/postgresql-9.4.1.tar.bz2```
- Run ```./configure --with-openssl --without-readline --prefix=~/libpq```. This step will fail with missing libs. Install necessary -devel lib dependencies until 
config succeeds.
- Build libpq: ```cd src/interfaces/libpq && make && make install```
- Build pg_config: ```cd ./src/bin/pg_config && make && make install```
- Add the location of pg_config binary to **PATH** and location of static libpq lib folder generated from above to **LD_LIBRARY_PATH**.
- Build pg-native via npm: ```npm install pg-native```. If this step generates errors about libpq.so.5 check LD_LIBRARY_PATH. If the step can't find
pg_config make sure pg_config is build and PATH points there.

In order to bundle this for lambda, generated so files should be in the **lib** folder of lamda project root. 
This is important as AWS Lambda adds /var/task/lib to LD_LIBRARY_PATH as per [this request](https://forums.aws.amazon.com/thread.jspa?messageID=706158).
Replace pg-native with folder built on EC2 instance.
