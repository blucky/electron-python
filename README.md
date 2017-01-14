# electron-python

* Electron
 * devtron
 * gulp
* Python
 * Flask
 * Flask-RestAPI



```
npm install
pip install -r requirements.txt
```


```
npm run start
npm run dev
npm run watch
npm run build
```


```
 Electron(Main Process) /
  ├ Electron(Render Process) /
  │  └ webview tag(connect localhost:5000) /
  │    └ vue.js
  ├ Python Process /
  │  └ Flask (server localhost:5000) /
  │    └ flask-restful API (localhost:5000/api/v1/)
```

