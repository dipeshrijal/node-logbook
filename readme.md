# node-logbook
# node-logbook
# node-logbook


docker run -d --restart=always --name mongo -p 27017:27017 -v /Users/drijal/Code/mongo/mount:/data/db mongo

docker run -d --rm --name node-logbook -p 4000:4000 dipeshrijal/logbook-node:1.0.0