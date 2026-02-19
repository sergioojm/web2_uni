title "Project Creator"
echo "Insert project name: "
set /p projectName=
mkdir %projectName%
cd %projectName%
mkdir src
echo {
  "name": "%projectName%",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.js",
    "scripts": {
    "dev": "node --watch --env-file=.env src/index.js",
    "start": "node --env-file=.env src/index.js",
    "test": "node --test"
  },
  "keywords": [],
  "author": "sergioojm",
  "license": "ISC",
  "type": "module"
} > package.json

echo {
    MY_SECRET=3000000
} > .env 

cd src 
mkdir controllers
mkdir middleware
mkdir models
mkdir routes
mkdir schemas
mkdir storage
mkdir utils
mkdir config
echo console.log("Hello World") > index.js
echo console.log("Created app.js") > app.js
echo "Project %projectName% created successfully!"
pause
