# MMM-My-Bus-Alert
My Bus Alert for Magic Mirror module

`Inspired by https://github.com/winstonma/MMM-HK-KMB`

### To use the module

- Download from this repo into MagicMirror/modules

```git clone https://github.com/normankong/MMM-My-Bus-Alert.git```

- Install the npm dependencies

```npm install```

- Update the config.js
```js
    {
        module: 'MMM-My-Bus-Alert',
        disabled : false,
        position: 'middle_center',
        config: {
            stops: [
                {
                    time : ["12:45", "13:10"],
                    bsiCode: 'CA07-N-4150-0',		
                    busRoutes : ["61M"],   
                    busBound: "2",
                    reloadInterval: 180000,
                }
            ]
        }
    }
```

- Create .env in root directory
```
ETA_URL=https://your_api.url
ETA_IDENTIFY=Token identifier
ETA_JWT=JWT Token
ETA_API_KEY=API Key
```

### Disclaimer
- You need to implement the bus estimated time arrival API by yourself.
- I have decoupled the setting into .env that was not in this repo.

