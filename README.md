# folder-upload-webpack-plugin
> Upload your folder to ftp/sftp server easier and faster

![](https://img.shields.io/npm/v/folder-upload-webpack-plugin.svg)
[![NPM](https://nodei.co/npm/folder-upload-webpack-plugin.png)](https://nodei.co/npm/folder-upload-webpack-plugin/)

## Installation
```bash
npm i -D folder-upload-webpack-plugin
```

## Usage
add following code to your webpack config file.
```javascript
const FolderUploadWebpackPlugin = require('folder-upload-webpack-plugin');
var webpackConfig = {
  entry: 'index.js',
  output: {
    path: 'assets',
    filename: 'index_bundle.js'
  },
  plugins: [
    new FolderUploadWebpackPlugin({
        // config options, you can find options detail down here
    })
  ]
}

```
### Options Detail:

Option Name|Usage|Type|Default Value
---|:--:|:--:|:-:
server|ssh config for options(or Array, to multiple servers) you can see [docs](https://github.com/mscdex/ssh2#client-methods)|Object|{port:22}
paths|function - return object {local: remote}, see path example|Function|(none)
clear|optional clear server folder before upload|Boolean|true
logging|optional show log|Boolean|false
compress|optional compress level|Int|0

### Extend Options Detail:

Option Name|Usage|Type|Default Value
---|:--:|:--:|:-:
archive|optional archive name|String|FolderUploadWebpackPlugin.zip
compressor|optional compressor class|Class|see code
ssh|optional ssh class|Class|see code
unCompress|optional compressor class|String|unzip
chmod|optional compress level|Octal|0o644

for other options you can see  https://github.com/mscdex/ssh2#client-methods

## path example

```
... 
paths: () => {
    let data = [];
    data[path.resolve(__dirname, "build_/")] = path.join("...build/");
    return data;
},...
```

## Change Log

### 2.0.0
```
- replace paths. see Options
- remove pathsClear && remotePath
```

### 1.1.0
```
- change upload type
```

### 1.0.0
```
- init
```
